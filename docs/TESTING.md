# Validation results

Validated on 2026-09-22 in Linux with Node.js 24, Python 3.12 and headless Chromium 133. These are observed results, not a promise of identical performance on every laptop.

| Check | Result |
|---|---|
| Strict TypeScript + Vite production build | PASS |
| Vitest mathematical/tracking tests | 14 PASS |
| Browser workflow tests | 5 PASS |
| FastAPI tests | 3 PASS |
| Prebuilt production inference smoke check | PASS |

Browser workflows cover:
- Synthetic source → two tracks → selected target lock → pause → CSV download.
- Analytics, all image-processing tabs, session save and load after refresh.
- No horizontal page overflow at 1920, 1600, 1440, 1366, 1280, 1024, 768 and 390 px widths.
- Actual MediaPipe browser inference on the supplied reference image (not mocked detections).
- Camera permission rejection with an actionable error and a usable dashboard.
- Controlled MediaStream input with real model inference and verification that Stop ends its video track.
- Uploaded WebM playback, pause, speed selection, seek and approximate frame step with actual model inference.

The source fixture is user-provided; a small 4-second WebM test fixture repeats it for deterministic media lifecycle checks. The production smoke check separately served the compiled dist folder through the prebuilt Python launcher, detected a face from the image, and observed zero external HTTP requests and zero JavaScript page errors.

Backend tests cover a full SQLite numeric-session lifecycle, append, analytics, CSV export, end, rejection after end, deletion, invalid upload rejection and actual MediaPipe inference producing 478 landmarks.

Unit tests cover center, displacement, elapsed-time velocity/acceleration, zero-time handling, coordinate inversion, IoU, EMA, bounds, identity pose matrix, ID stability under reordered detections, reacquisition without speed spikes, ID timeout, disabling reacquisition, raw/smoothed preservation, CSV/statistics pipeline and invalid session rejection.

## Run again

```bash
cd frontend
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
node tests/prebuilt-smoke.mjs
```

`CHROMIUM_PATH` optionally points to an installed Chromium executable. For backend tests run `python -m pytest tests/test_api.py -q` from the root after installing backend requirements.

## Verification limits

There was no physical USB/webcam device in the build environment; the camera test used a controlled MediaStream. User hardware, browser permission UI, real-world multi-person occlusion, cross-browser recording codecs, prolonged sessions and deployment infrastructure need testing on the intended target. Docker configuration is included but was not executed here. No claim of an accuracy percentage, calibrated physical depth, thermal temperature, clinical validity, guaranteed FPS or audited cloud security is made.
