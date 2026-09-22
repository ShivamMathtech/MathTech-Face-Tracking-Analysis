# Architecture

React handles controls, navigation and metadata. A centralized external store (`services/engine.ts`) publishes UI changes at approximately 5 Hz. Camera frames and overlays stay in canvas; the React component tree does not render at camera frame rate. The capture scheduler throttles work, honors frame skipping and allows only one outstanding inference.

Sources (webcam, browser-decoded video, image, synthetic demo) feed a reusable raw canvas. An ImageBitmap is transferred to a **classic Web Worker** built by esbuild. Classic worker mode is intentional: MediaPipe's local WASM loader uses `importScripts`. FaceLandmarker and FaceDetector run in the worker using the CPU delegate and local files. The result contains boxes, landmarks, optional matched confidence, pose and geometric blendshape coefficients.

The replaceable `Detection` contract separates CV results from `Tracker`. A future engine only needs to return this contract. An explicitly enabled API adapter encodes one JPEG at a time and returns the same detection contract. Source epochs discard stale responses after stop/reset. A spatial association tracker handles temporary IDs, prediction, reacquisition and EMA.

Canvas overlays draw boxes, centers, selected landmark groups, trails, axes, vectors and heatmaps. Canvas graphs read bounded numeric histories. Three.js shows a generic head oriented by pose estimates. Image processing uses reduced-resolution previews; exports use source dimensions.

Memory bounds: 1,800 recent samples per track, 100,000 samples per session, 500 session events, 120 displayed log entries. Numeric recording stops visibly at the session cap. Saved sessions use IndexedDB. User-initiated JSON is the portable session format. Raw frames are excluded from saved sessions.

The optional FastAPI service stores numeric API sessions in SQLite and exposes a frame-analysis endpoint. Browser IndexedDB and API SQLite are separate stores; there is no implicit sync. The API is a loopback, single-user companion, not a multi-tenant account service.
