# Computer vision and measurement model

1. Media source is decoded locally.
2. A single transferable ImageBitmap is sent to a worker, with a monotonically increasing MediaPipe timestamp.
3. FaceLandmarker returns 478 landmarks, transformation matrices and movement blendshapes. FaceDetector provides scores; greatest-IoU overlap above 0.1 associates an available score. No match means null/N/A.
4. Boxes are clamped to the source frame. Faces below the minimum size are rejected.
5. Candidate temporal associations are gated by center displacement normalized to face size and width ratio. Cost combines predicted-center distance, box overlap and scale change. Globally sorted one-to-one assignments are applied. This is a greedy assignment, not Hungarian optimization or biometric reidentification.
6. EMA smooths each box coordinate: previous × smoothing + new × (1−smoothing). Raw center is also stored.
7. Center = (x + width/2, y + height/2). Displacement uses adjacent centers, speed = Euclidean distance / elapsed seconds, acceleration = speed change / seconds. Direction uses atan2 in image coordinates.
8. Webcam timestamps use wall time. Video measurement timestamps use source-video time, independent of playback speed. Source seek starts a fresh session. Worker inference timestamps remain monotonic.
9. Face loss immediately marks the track lost. Reacquisition is allowed only inside the configured timeout; expiry allocates a new ID. A lock remains on the expired ID until explicitly reset/unlocked. Reacquisition and pause/resume reset motion derivatives to avoid false velocity spikes.
10. Depth ratio = first smoothed box width / current smoothed width. Rotation and facial shape affect this ratio; it is not calibrated distance.

Pose extracts XYZ Euler orientation from the transformation rotation (degrees). The generic 3D head follows these values and normalized image center. It is not an individual's reconstructed face. RGB image filters do not produce infrared or thermal sensor measurements. The face mask follows oval landmarks; the depth color renderer is a stylized radial gradient, explicitly disclosed in Help and README.

Performance depends on CPU, image resolution and face count. There is no universal 30 FPS guarantee. The pipeline is local and avoids overlapping inference jobs, while preview rendering is throttled separately.

Primary references:
- https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js
- https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/web_js
- https://threejs.org/docs/#api/en/math/Matrix4
