import type { Detection, Point, Sample, Settings, Track } from "../types";
import { center, distance, iou, movement, smooth, landmarkRatio } from "./math";
/** Session-only spatial tracker. Uses velocity prediction and global sorted matching, never face embeddings. */
export class Tracker {
  tracks: Track[] = [];
  nextId = 1;
  reset() {
    this.tracks = [];
    this.nextId = 1;
  }
  rebase() {
    for (const t of this.tracks) {
      t.history = [];
      t.velocity = { x: 0, y: 0, z: 0 };
    }
  }
  update(
    detections: Detection[],
    timestamp: number,
    settings: Settings,
    source: string,
  ): Track[] {
    this.tracks = this.tracks.filter(
      (t) => timestamp - t.lastSeen <= settings.lostTimeout,
    );
    const ds = detections.filter(
      (d) => Math.min(d.bbox.width, d.bbox.height) >= settings.minSize,
    );
    const pairs: { ti: number; di: number; cost: number }[] = [];
    this.tracks.forEach((t, ti) =>
      ds.forEach((d, di) => {
        if (t.status === "lost" && !settings.reacquire) return;
        const dt = Math.min((timestamp - t.lastSeen) / 1000, 0.3);
        const predicted = {
          ...t.raw,
          x: t.raw.x + t.velocity.x * dt,
          y: t.raw.y + t.velocity.y * dt,
        };
        const scale = Math.max(
          t.bbox.width,
          t.bbox.height,
          d.bbox.width,
          d.bbox.height,
          1,
        );
        const ratio = d.bbox.width / Math.max(1, t.bbox.width);
        const gap = distance(predicted, center(d.bbox)) / scale;
        if (gap < settings.sensitivity && ratio > 0.4 && ratio < 2.5)
          pairs.push({
            ti,
            di,
            cost:
              gap +
              0.25 * (1 - iou(t.bbox, d.bbox)) +
              0.15 * Math.abs(Math.log(ratio)),
          });
      }),
    );
    pairs.sort((a, b) => a.cost - b.cost);
    const usedTracks = new Set<number>(),
      usedDetections = new Set<number>(),
      matched = new Map<number, Track>();
    for (const p of pairs) {
      if (!usedTracks.has(p.ti) && !usedDetections.has(p.di)) {
        usedTracks.add(p.ti);
        usedDetections.add(p.di);
        matched.set(p.di, this.tracks[p.ti]);
      }
    }
    const current = ds.map((d, di) => {
      const previous = matched.get(di);
      const id =
        previous?.id ?? `Face-${String(this.nextId++).padStart(2, "0")}`;
      const raw = center(d.bbox);
      const b = previous
        ? {
            x: smooth(previous.bbox.x, d.bbox.x, settings.smoothing),
            y: smooth(previous.bbox.y, d.bbox.y, settings.smoothing),
            width: smooth(
              previous.bbox.width,
              d.bbox.width,
              settings.smoothing,
            ),
            height: smooth(
              previous.bbox.height,
              d.bbox.height,
              settings.smoothing,
            ),
          }
        : d.bbox;
      const c = center(b);
      const continuous =
        previous && previous.status !== "lost" && previous.history.length > 0;
      const m = movement(
        continuous ? previous.center : c,
        c,
        continuous ? timestamp - previous.lastSeen : 0,
        continuous ? previous.sample.velocity : 0,
      );
      const baselineWidth = previous?.baselineWidth ?? b.width;
      const depth = baselineWidth / Math.max(1, b.width);
      const p = d.landmarks;
      const pt = (i: number): Point => p[i] ?? c;
      const s: Sample = {
        timestamp,
        face_id: id,
        source,
        confidence: d.confidence,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        center_x: c.x,
        center_y: c.y,
        raw_x: raw.x,
        raw_y: raw.y,
        delta_x: m.dx,
        delta_y: m.dy,
        delta_z: continuous ? depth - previous.sample.depth : 0,
        depth,
        distance: m.distance,
        velocity: m.speed,
        vx: m.vx,
        vy: m.vy,
        acceleration: m.acceleration,
        direction: m.direction,
        ...d.pose,
        nose_x: pt(1).x,
        nose_y: pt(1).y,
        left_eye_x: pt(263).x,
        left_eye_y: pt(263).y,
        right_eye_x: pt(33).x,
        right_eye_y: pt(33).y,
        mouth_x: pt(13).x,
        mouth_y: pt(13).y,
        chin_x: pt(152).x,
        chin_y: pt(152).y,
        eye_ratio: landmarkRatio(p, 159, 145, 33, 133),
        mouth_ratio: landmarkRatio(p, 13, 14, 61, 291),
        blink_left: d.signals.eyeBlinkLeft ?? 0,
        blink_right: d.signals.eyeBlinkRight ?? 0,
      };
      return {
        ...d,
        bbox: b,
        id,
        center: c,
        raw,
        lastSeen: timestamp,
        status: "tracking" as const,
        velocity: { x: m.vx, y: m.vy, z: 0 },
        baselineWidth,
        sample: s,
        history: [...(previous?.history ?? []), s].slice(-1800),
      };
    });
    this.tracks = [
      ...current,
      ...this.tracks
        .filter((_, i) => !usedTracks.has(i))
        .map((t) => ({ ...t, status: "lost" as const })),
    ];
    return this.tracks;
  }
}
