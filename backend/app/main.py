"""Optional local API. Frames are analyzed only on explicit POST and never saved."""
from __future__ import annotations
import csv
import io
import json
import math
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from PIL import Image, UnidentifiedImageError
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.getenv('MATHTECH_DB', str(ROOT / 'backend/data/sessions.db')))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
MAX_BYTES = 10 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 20_000_000
app = FastAPI(title='MathTech Face Tracking API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=os.getenv('ALLOWED_ORIGINS','http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080').split(','), allow_methods=['GET','POST','DELETE'], allow_headers=['Content-Type'])

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute('CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, document TEXT NOT NULL)')
    return conn

def now(): return datetime.now(timezone.utc).isoformat()

class StartSession(BaseModel):
    model_config = ConfigDict(extra='forbid')
    source: str = Field(default='api', max_length=40)
    camera: str = Field(default='External source', max_length=200)
    settings: dict = Field(default_factory=dict)

class TrackingPoint(BaseModel):
    model_config = ConfigDict(extra='forbid', allow_inf_nan=False)
    timestamp: float
    face_id: str = Field(max_length=50, pattern=r'^[A-Za-z0-9_-]+$')
    center_x: float
    center_y: float
    velocity: float = Field(default=0, ge=0)
    distance: float = Field(default=0, ge=0)
    yaw: float = 0
    pitch: float = 0
    roll: float = 0
    confidence: float | None = Field(default=None, ge=0, le=1)

class AppendPoints(BaseModel):
    points: list[TrackingPoint] = Field(max_length=1000)

class EndSession(BaseModel):
    session_id: str

def get_session(session_id: str):
    with db() as c: row = c.execute('SELECT document FROM sessions WHERE id=?',(session_id,)).fetchone()
    if not row: raise HTTPException(404,'Session not found')
    return json.loads(row[0])

def write_session(session):
    with db() as c: c.execute('INSERT OR REPLACE INTO sessions VALUES (?,?)',(session['id'],json.dumps(session,allow_nan=False)))

@app.get('/api/health')
def health(): return {'status':'ok','version':'1.0.0','frame_storage':False,'vision_loaded':_landmarker is not None}

@app.post('/api/session/start', status_code=201)
def start_session(body: StartSession):
    session={'id':str(uuid.uuid4()),'start_time':now(),'end_time':None,**body.model_dump(),'tracking_data':[]}
    write_session(session)
    return session

@app.post('/api/session/{session_id}/points')
def append_points(session_id: str, body: AppendPoints):
    # Immediate transaction makes the read-modify-write atomic across requests.
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row=c.execute('SELECT document FROM sessions WHERE id=?',(session_id,)).fetchone()
        if not row: raise HTTPException(404,'Session not found')
        session=json.loads(row[0])
        if session['end_time']: raise HTTPException(409,'Session has ended')
        if len(session['tracking_data'])+len(body.points)>100000: raise HTTPException(413,'Session limit reached')
        session['tracking_data'].extend(p.model_dump() for p in body.points)
        c.execute('UPDATE sessions SET document=? WHERE id=?',(json.dumps(session),session_id))
    return {'stored':len(session['tracking_data'])}

@app.post('/api/session/end')
def end_session(body: EndSession):
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        row=c.execute('SELECT document FROM sessions WHERE id=?',(body.session_id,)).fetchone()
        if not row: raise HTTPException(404,'Session not found')
        session=json.loads(row[0]);session['end_time']=now()
        c.execute('UPDATE sessions SET document=? WHERE id=?',(json.dumps(session),body.session_id))
    return session

@app.get('/api/session/{session_id}')
def read_session(session_id: str): return get_session(session_id)

@app.delete('/api/session/{session_id}')
def remove_session(session_id: str):
    get_session(session_id)
    with db() as c:c.execute('DELETE FROM sessions WHERE id=?',(session_id,))
    return {'deleted':True}

@app.get('/api/session/{session_id}/analytics')
def analytics(session_id: str):
    points=get_session(session_id)['tracking_data']
    return {'samples':len(points),'faces':len(set(p['face_id'] for p in points)), 'total_distance':sum(p['distance'] for p in points),'average_velocity':sum(p['velocity'] for p in points)/max(1,len(points)), 'maximum_velocity':max((p['velocity'] for p in points),default=0)}

@app.get('/api/session/{session_id}/export')
def export_session(session_id: str, format: str='json'):
    session=get_session(session_id)
    if format=='json':return Response(json.dumps(session,indent=2),media_type='application/json',headers={'Content-Disposition':f'attachment; filename="{session_id}.json"'})
    if format!='csv':raise HTTPException(400,'Format must be csv or json')
    out=io.StringIO();writer=csv.DictWriter(out,fieldnames=list(TrackingPoint.model_fields));writer.writeheader();writer.writerows(session['tracking_data'])
    return Response(out.getvalue(),media_type='text/csv',headers={'Content-Disposition':f'attachment; filename="{session_id}.csv"'})

_lock=threading.Lock()
_landmarker=None
_detector=None

def analyze(data:bytes):
    global _landmarker,_detector
    try:
        with Image.open(io.BytesIO(data)) as image:
            if image.width*image.height>20_000_000:raise HTTPException(413,'Image exceeds 20 megapixels')
            rgb=np.asarray(image.convert('RGB'))
    except (UnidentifiedImageError,OSError,Image.DecompressionBombError) as exc:raise HTTPException(400,'Invalid or oversized image') from exc
    h,w=rgb.shape[:2]
    try:
        import mediapipe as mp
        with _lock:
            if _landmarker is None:
                models=Path(os.getenv('MATHTECH_MODELS',str(ROOT/'frontend/public/models')))
                _landmarker=mp.tasks.vision.FaceLandmarker.create_from_options(mp.tasks.vision.FaceLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(models/'face_landmarker.task')),num_faces=5,output_face_blendshapes=True,output_facial_transformation_matrixes=True))
                _detector=mp.tasks.vision.FaceDetector.create_from_options(mp.tasks.vision.FaceDetectorOptions(base_options=mp.tasks.BaseOptions(model_asset_path=str(models/'blaze_face_short_range.tflite'))))
            frame=mp.Image(image_format=mp.ImageFormat.SRGB,data=rgb)
            result=_landmarker.detect(frame);detected=_detector.detect(frame).detections
    except Exception as exc:
        raise HTTPException(503,'Vision model could not initialize or process this image. Verify installed dependencies and local model files.') from exc
    faces=[]
    for i,landmarks in enumerate(result.face_landmarks):
        xs=[p.x*w for p in landmarks];ys=[p.y*h for p in landmarks]
        x=max(0,min(xs));y=max(0,min(ys));bw=min(w,max(xs))-x;bh=min(h,max(ys))-y
        confidence=None;best=0
        for detection in detected:
            b=detection.bounding_box;area=max(0,min(x+bw,b.origin_x+b.width)-max(x,b.origin_x))*max(0,min(y+bh,b.origin_y+b.height)-max(y,b.origin_y))
            overlap=area/max(1,bw*bh+b.width*b.height-area)
            if overlap>max(.1,best):best=overlap;confidence=float(detection.categories[0].score)
        matrix=np.asarray(result.facial_transformation_matrixes[i]);yaw=math.asin(float(np.clip(matrix[0,2],-1,1)))
        pitch=math.atan2(-float(matrix[1,2]),float(matrix[2,2]));roll=math.atan2(-float(matrix[0,1]),float(matrix[0,0]))
        faces.append({'bbox':{'x':x,'y':y,'width':bw,'height':bh},'landmarks':[{'x':p.x*w,'y':p.y*h,'z':p.z*w} for p in landmarks],'confidence':confidence,'pose':{'yaw':math.degrees(yaw),'pitch':math.degrees(pitch),'roll':math.degrees(roll)},'signals':{c.category_name:float(c.score) for c in result.face_blendshapes[i]}})
    return {'timestamp':datetime.now(timezone.utc).timestamp()*1000,'width':w,'height':h,'faces':faces}

@app.post('/api/analyze/frame')
def analyze_frame(file: Annotated[UploadFile,File()]):
    if file.content_type not in {'image/jpeg','image/png','image/webp'}:raise HTTPException(415,'Only JPEG, PNG and WebP images are accepted')
    data=file.file.read(MAX_BYTES+1)
    if len(data)>MAX_BYTES:raise HTTPException(413,'Image exceeds 10 MB')
    return analyze(data)
