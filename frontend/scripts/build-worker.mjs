import { build } from "esbuild";
// A classic worker is required because MediaPipe's WASM loader uses importScripts.
await build({
  entryPoints: ["src/workers/vision.worker.ts"],
  outfile: "public/vision-worker.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
});
