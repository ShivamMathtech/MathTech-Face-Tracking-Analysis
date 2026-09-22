# Optional API

Run `python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000` from the project root. Interactive schema: `/docs`. Bind to loopback for local use. No frames are written to disk. Face IDs and temporal tracking are assigned in the frontend; `/analyze/frame` is stateless detection, deliberately not an identity endpoint.

| Method | Path | Function |
|---|---|---|
| GET | /api/health | API health and whether vision is loaded |
| POST | /api/session/start | Create numeric session; source, camera, settings |
| POST | /api/session/{id}/points | Append up to 1,000 validated points atomically |
| POST | /api/session/end | End session using session_id |
| GET | /api/session/{id} | Read numeric data |
| GET | /api/session/{id}/analytics | Counts, distance and speed summary |
| GET | /api/session/{id}/export?format=json | Download JSON; also supports csv |
| DELETE | /api/session/{id} | Permanently delete a numeric session |
| POST | /api/analyze/frame | Multipart file; JPEG, PNG or WebP, max 10 MB/20 MP |

Frame response: `{timestamp, width, height, faces:[{bbox,landmarks,confidence,pose,signals}]}`. Landmarks are source-pixel x/y with model-relative z. Confidence is a separate detector score or null. The API vision model is lazy-loaded and guarded by a lock. The browser owns temporal filtering and settings such as minimum face size. Backend detection uses fixed model thresholds/defaults and up to five faces.

Example:

```bash
curl http://127.0.0.1:8000/api/health
curl -X POST -F 'file=@portrait.jpg' http://127.0.0.1:8000/api/analyze/frame
curl -H 'Content-Type: application/json' -d '{"source":"test"}' http://127.0.0.1:8000/api/session/start
```

Status codes: 400 malformed image/format; 404 unknown session; 409 ended session; 413 size/retention limit; 415 unsupported media; 422 schema validation; 503 model initialization/processing failure. Session SQL queries are parameterized. The local API does not provide account authentication; use an authenticated private gateway if you deploy it outside loopback.
