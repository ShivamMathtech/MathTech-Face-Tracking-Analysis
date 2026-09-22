# Scope and behavior

All navigation destinations and shipped controls connect to implemented behavior. The default pipeline is browser-local and the optional API is operational. No paid API key is required.

Deliberate bounded behavior:
- Up to five model faces; synthetic demo displays up to two subjects.
- Retained movement trail up to 1,800 samples instead of unbounded memory.
- 100,000 samples/session, 500 session events. Numeric recording stops visibly at the cap.
- CSV/JSON/report exports honor target selection; choose Auto for all current-session faces.
- Saved sessions are numeric datasets, not video replay. Download each saved session for its complete history.
- Video seek starts a fresh segment; frame step is 1/30 second, not codec-frame-accurate decoding.
- The API is stateless for individual frames. Temporal IDs, settings, smoothing and target lock live in the frontend. API sessions are managed separately through documented endpoints.
- Optional advanced items from the brief such as Kalman filtering, calibrated camera intrinsics, semantic portrait segmentation, face symmetry metrics and frequency-domain head-motion analysis are extension points, not presented as implemented controls.

Estimates are labeled: pose, relative apparent-size depth, geometric face masks, RGB thermal/night style and the stylized depth color view. Demo sources are labeled on the feed and inside exported rows. Actual browser and Python landmark inference were verified.
