import type { Box, Point, Pose } from "../types";
export const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));
export const center = (b: Box): Point => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
  z: 0,
});
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const smooth = (previous: number, next: number, amount: number) =>
  previous * amount + next * (1 - amount);
export function iou(a: Box, b: Box) {
  const w = Math.max(
    0,
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
  );
  const h = Math.max(
    0,
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
  );
  const intersection = w * h;
  return (
    intersection /
    Math.max(1, a.width * a.height + b.width * b.height - intersection)
  );
}
export function movement(a: Point, b: Point, dt: number, previousSpeed = 0) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    d = Math.hypot(dx, dy),
    seconds = Math.max(0, dt) / 1000;
  const speed = seconds > 0 ? d / seconds : 0;
  return {
    dx,
    dy,
    distance: d,
    speed,
    vx: seconds ? dx / seconds : 0,
    vy: seconds ? dy / seconds : 0,
    acceleration: seconds ? (speed - previousSpeed) / seconds : 0,
    direction: d ? (Math.atan2(dy, dx) * 180) / Math.PI : 0,
  };
}
export const convert = (p: Point, height: number, mode: "image" | "math") => ({
  ...p,
  y: mode === "math" ? height - p.y : p.y,
});
export function bounds(points: Point[], w: number, h: number): Box {
  const xs = points.map((p) => p.x * w),
    ys = points.map((p) => p.y * h);
  const x = clamp(Math.min(...xs), 0, w),
    y = clamp(Math.min(...ys), 0, h);
  return {
    x,
    y,
    width: Math.max(0, clamp(Math.max(...xs), 0, w) - x),
    height: Math.max(0, clamp(Math.max(...ys), 0, h) - y),
  };
}
export function poseFromMatrix(d: number[]): Pose {
  if (d.length !== 16) return { yaw: 0, pitch: 0, roll: 0 };
  const y = Math.asin(clamp(d[8], -1, 1));
  const x =
    Math.abs(d[8]) < 0.999999
      ? Math.atan2(-d[9], d[10])
      : Math.atan2(d[6], d[5]);
  const z = Math.abs(d[8]) < 0.999999 ? Math.atan2(-d[4], d[0]) : 0;
  return {
    pitch: (x * 180) / Math.PI,
    yaw: (y * 180) / Math.PI,
    roll: (z * 180) / Math.PI,
  };
}
export const GROUPS: Record<string, number[]> = {
  "Left Eye": [362, 385, 387, 263, 373, 380],
  "Right Eye": [33, 160, 158, 133, 153, 144],
  Nose: [1, 2, 4, 5, 6, 98, 327],
  Mouth: [61, 40, 37, 0, 267, 270, 291, 321, 314, 17, 84, 91, 13, 14],
  "Left Brow": [276, 283, 282, 295, 285],
  "Right Brow": [46, 53, 52, 65, 55],
  "Left Cheek": [280, 330, 347, 346],
  "Right Cheek": [50, 101, 118, 117],
  Chin: [152, 175, 199],
  Jawline: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],
};
export const landmarkRatio = (
  p: Point[],
  a: number,
  b: number,
  c: number,
  d: number,
) =>
  p[a] && p[b] && p[c] && p[d]
    ? distance(p[a], p[b]) / Math.max(1e-8, distance(p[c], p[d]))
    : 0;
