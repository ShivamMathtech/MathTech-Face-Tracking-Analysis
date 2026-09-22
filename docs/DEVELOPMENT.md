# Development

Node.js 22+ and npm are recommended. `npm ci` installs exact lockfile versions and copies the matching MediaPipe WASM runtime to public/wasm. `npm run dev` builds the classic vision worker then runs Vite. If you edit the worker while the dev server is running, execute `node scripts/build-worker.mjs` and refresh the page. `npm run build` rebuilds the worker, checks strict TypeScript and writes dist.

Keep raw per-frame work outside React. Add new detectors by returning `Detection[]` to the engine. Keep tracking measurements source-labeled and use real timestamps. Avoid putting camera pixels into application state or saved session JSON.

Dependency/model versions are pinned; official model URLs and SHA-256 hashes are recorded in THIRD_PARTY.md. Models are bundled in the ZIP, so no first-run model download is necessary. The same model folder is shared with Python.

The prebuilt Python launcher serves only the compiled dist directory and binds 127.0.0.1. Vite dev and preview also bind loopback. For a remote frontend, deploy dist over HTTPS. For Netlify use base directory frontend and publish dist; for Vercel choose Vite, root frontend, build npm run build, output dist.

Automated tests are in frontend/tests and tests/. E2E accepts CHROMIUM_PATH to use a locally available Chromium binary. It covers actual inference using docs/reference-ui.png. Browser inference runs without external requests.
