import os
import tempfile
from pathlib import Path
os.environ['MATHTECH_DB'] = str(Path(tempfile.mkdtemp()) / 'test.db')
from fastapi.testclient import TestClient
from backend.app.main import app
client=TestClient(app)
def test_session_lifecycle_and_export():
    assert client.get('/api/health').status_code==200
    s=client.post('/api/session/start',json={'source':'test'}).json();sid=s['id']
    point={'timestamp':1000,'face_id':'Face-01','center_x':12,'center_y':16,'distance':5,'velocity':10}
    assert client.post(f'/api/session/{sid}/points',json={'points':[point]}).json()['stored']==1
    assert client.get(f'/api/session/{sid}/analytics').json()['total_distance']==5
    assert 'center_x' in client.get(f'/api/session/{sid}/export?format=csv').text
    assert client.post('/api/session/end',json={'session_id':sid}).json()['end_time']
    assert client.post(f'/api/session/{sid}/points',json={'points':[point]}).status_code==409
    assert client.delete(f'/api/session/{sid}').status_code==200
    assert client.get(f'/api/session/{sid}').status_code==404

def test_invalid_upload():
    assert client.post('/api/analyze/frame',files={'file':('x.txt',b'bad','text/plain')}).status_code==415
    assert client.post('/api/analyze/frame',files={'file':('x.png',b'bad','image/png')}).status_code==400

def test_actual_model_inference():
    image=Path(__file__).resolve().parents[1]/'docs/reference-ui.png'
    result=client.post('/api/analyze/frame',files={'file':('reference.png',image.read_bytes(),'image/png')})
    assert result.status_code==200,result.text
    faces=result.json()['faces']
    assert len(faces)>=1
    assert len(faces[0]['landmarks'])==478
    assert faces[0]['bbox']['width']>0
