import { describe, it, expect } from "vitest";
import {
  bounds,
  center,
  movement,
  convert,
  iou,
  smooth,
  poseFromMatrix,
} from "../src/core/math";
import { Tracker } from "../src/core/tracker";
import { csv, statistics, validateSession } from "../src/core/session";
import type { Detection, Settings } from "../src/types";
const settings = {
  smoothing: 0,
  lostTimeout: 1000,
  sensitivity: 1.2,
  minSize: 10,
  reacquire: true,
} as Settings;
const d = (x: number, y = 10): Detection => ({
  bbox: { x, y, width: 100, height: 100 },
  landmarks: [],
  pose: { yaw: 0, pitch: 0, roll: 0 },
  confidence: 0.9,
  signals: {},
});
describe("measurement math", () => {
  it("uses box center", () =>
    expect(center({ x: 490, y: 185, width: 284, height: 362 })).toEqual({
      x: 632,
      y: 366,
      z: 0,
    }));
  it("uses elapsed time for speed and acceleration", () => {
    const m = movement({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, 500, 4);
    expect(m.distance).toBe(5);
    expect(m.speed).toBe(10);
    expect(m.acceleration).toBe(12);
  });
  it("handles zero time", () =>
    expect(movement({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, 0).speed).toBe(
      0,
    ));
  it("converts the coordinate origin", () =>
    expect(convert({ x: 12, y: 20, z: 0 }, 100, "math").y).toBe(80));
  it("computes overlap and smoothing", () => {
    expect(iou(d(0).bbox, d(50).bbox)).toBeCloseTo(1 / 3);
    expect(smooth(10, 30, 0.25)).toBe(25);
  });
  it("clamps image bounds", () =>
    expect(
      bounds(
        [
          { x: -0.1, y: 0.1, z: 0 },
          { x: 0.8, y: 1.2, z: 0 },
        ],
        100,
        100,
      ),
    ).toEqual({ x: 0, y: 10, width: 80, height: 90 }));
  it("extracts an identity rotation", () => {
    const p = poseFromMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    expect(p.yaw).toBeCloseTo(0);
    expect(p.pitch).toBeCloseTo(0);
    expect(p.roll).toBeCloseTo(0);
  });
});
describe("temporal tracking", () => {
  it("associates reordered detections to the same spatial IDs", () => {
    const t = new Tracker();
    const first = t.update([d(0), d(300)], 1000, settings, "camera");
    const left = first[0].id;
    const next = t.update([d(305), d(5)], 1100, settings, "camera");
    expect(next[1].id).toBe(left);
    expect(next[1].sample.velocity).toBeCloseTo(50);
  });
  it("reacquires before timeout without a motion spike", () => {
    const t = new Tracker();
    const id = t.update([d(0)], 1000, settings, "camera")[0].id;
    expect(t.update([], 1100, settings, "camera")[0].status).toBe("lost");
    const next = t.update([d(8)], 1300, settings, "camera")[0];
    expect(next.id).toBe(id);
    expect(next.sample.velocity).toBe(0);
  });
  it("expires IDs after the timeout", () => {
    const t = new Tracker();
    const id = t.update([d(0)], 1000, settings, "camera")[0].id;
    expect(t.update([d(0)], 3000, settings, "camera")[0].id).not.toBe(id);
  });
  it("does not reacquire when disabled", () => {
    const t = new Tracker();
    const id = t.update([d(0)], 1000, settings, "camera")[0].id;
    t.update([], 1100, settings, "camera");
    expect(
      t.update([d(0)], 1200, { ...settings, reacquire: false }, "camera")[0].id,
    ).not.toBe(id);
  });
  it("preserves raw positions under EMA", () => {
    const t = new Tracker();
    t.update([d(0)], 1000, settings, "camera");
    const a = t.update(
      [d(20)],
      1100,
      { ...settings, smoothing: 0.5 },
      "camera",
    )[0];
    expect(a.sample.raw_x).toBe(70);
    expect(a.sample.center_x).toBe(60);
  });
  it("exports actual pipeline samples and statistics", () => {
    const t = new Tracker();
    t.update([d(0)], 1000, settings, "camera");
    const a = t.update([d(3, 14)], 1500, settings, "camera")[0];
    const text = csv(a.history);
    expect(text).toContain("face_id");
    expect(text).toContain("Face-01");
    expect(statistics(a.history).total_distance).toBe(5);
    expect(statistics(a.history).maximum_velocity).toBe(10);
  });
  it("rejects malformed imported sessions", () =>
    expect(() => validateSession({ version: 0, samples: [] })).toThrow());
});
