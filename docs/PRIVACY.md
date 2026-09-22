# Privacy and data handling

No camera permission is requested on page load. Demo does not open a camera. Webcam tracks are stopped when Stop, source switch, or backend-mode changes occur. Camera streams never include audio. The Stop button remains available during model loading.

Default inference runs in a browser worker against local model files. There are no analytics beacons, fonts/CDN calls or default cloud uploads. Optional backend mode is hidden unless enabled in configuration and requires a visible user toggle; it sends JPEG frames to the configured endpoint.

No face embeddings, names, identity recognition, emotion classifications, health judgments or biometric identity database are implemented. Temporary IDs describe spatial continuity only. Landmark and movement data can still be sensitive: save/export only when appropriate and delete saved sessions from Export when finished.

Sessions are memory-only by default. Explicit Save or Auto-save writes numeric measurements/settings/events to IndexedDB. PNG and raw video files are downloaded only after explicit controls. Video recording is in memory until stopped and downloaded; avoid indefinitely long recordings. The API never saves incoming images; its SQLite store contains explicitly submitted numeric session data.

Demo, camera, video and image changes create separate sessions. Raw frames are not embedded in session exports. Clearing browser site data removes saved sessions and settings for that origin.
