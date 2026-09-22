import { cp, mkdir } from "node:fs/promises";
await mkdir("public/wasm", { recursive: true });
await cp("node_modules/@mediapipe/tasks-vision/wasm", "public/wasm", {
  recursive: true,
});
console.log(
  "MediaPipe runtime copied locally. Camera frames never need a CDN.",
);
