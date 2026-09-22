# Third-party components and models

Original application code is MIT licensed. MathTech branding and the supplied reference image are user-provided. No rights to third-party brands or models are transferred by the application license.

- React / React DOM: MIT.
- Three.js: MIT.
- Lucide: ISC.
- Vite, TypeScript, esbuild and test tooling: their respective upstream licenses.
- MediaPipe Tasks Vision: Apache-2.0. Official source: https://github.com/google-ai-edge/mediapipe
- MediaPipe model assets distributed from Google's official model bucket. Consult the upstream model cards and terms for your intended deployment: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker and https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector

Bundled model sources:

https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite

Hashes are included in model-sha256.txt. Model assets are not covered by the original application's MIT grant. Dependencies retain their own license notices in installed npm/Python distributions.
