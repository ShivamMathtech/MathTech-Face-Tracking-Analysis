import type { Session, Settings, Sample, SourceKind } from "../types";
export const SESSION_LIMIT = 100000;
export function newSession(
  settings: Settings,
  source: SourceKind = "none",
  camera = "No source",
): Session {
  return {
    version: 1,
    id: crypto.randomUUID(),
    start_time: new Date().toISOString(),
    end_time: null,
    source,
    camera,
    resolution: settings.resolution,
    model:
      source === "demo"
        ? "Synthetic demonstration"
        : "MediaPipe Face Landmarker + Face Detector",
    settings: structuredClone(settings),
    samples: [],
    events: [],
    dropped_samples: 0,
  };
}
export function statistics(samples: Sample[]) {
  const avg = (key: keyof Sample) =>
    samples.length
      ? samples.reduce((s, r) => s + Number(r[key] ?? 0), 0) / samples.length
      : 0;
  const max = (key: keyof Sample) =>
    samples.reduce((s, r) => Math.max(s, Math.abs(Number(r[key] ?? 0))), 0);
  const confidence = samples.filter((s) => s.confidence !== null);
  const first = samples[0],
    last = samples.at(-1);
  return {
    samples: samples.length,
    faces: new Set(samples.map((s) => s.face_id)).size,
    duration_seconds:
      first && last ? (last.timestamp - first.timestamp) / 1000 : 0,
    average_confidence: confidence.length
      ? confidence.reduce((a, s) => a + (s.confidence ?? 0), 0) /
        confidence.length
      : null,
    average_area: samples.length
      ? samples.reduce((a, s) => a + s.width * s.height, 0) / samples.length
      : 0,
    total_distance: samples.reduce((a, s) => a + s.distance, 0),
    average_velocity: avg("velocity"),
    maximum_velocity: max("velocity"),
    average_yaw: avg("yaw"),
    maximum_yaw: max("yaw"),
    average_pitch: avg("pitch"),
    maximum_pitch: max("pitch"),
    average_roll: avg("roll"),
    maximum_roll: max("roll"),
  };
}
export function csv(samples: Sample[]) {
  if (!samples.length)
    return "timestamp,face_id,confidence,x,y,width,height,center_x,center_y,delta_x,delta_y,velocity,yaw,pitch,roll\n";
  const keys = Object.keys(samples[0]) as (keyof Sample)[];
  const escape = (v: unknown) => {
    const text = String(v ?? "");
    const safe =
      typeof v === "string" && /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return [
    keys.map(escape).join(","),
    ...samples.map((s) => keys.map((k) => escape(s[k])).join(",")),
  ].join("\n");
}
export function download(
  content: Blob | string,
  name: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("mathtech-face-tracking", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("sessions", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export async function saveSession(s: Session) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("sessions", "readwrite");
    tx.objectStore("sessions").put(structuredClone(s));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
export async function listSessions() {
  const db = await openDB();
  const sessions = await new Promise<Session[]>((resolve, reject) => {
    const r = db.transaction("sessions").objectStore("sessions").getAll();
    r.onsuccess = () => resolve(r.result as Session[]);
    r.onerror = () => reject(r.error);
  });
  db.close();
  return sessions.sort((a, b) => b.start_time.localeCompare(a.start_time));
}
export async function deleteSession(id: string) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction("sessions", "readwrite");
    t.objectStore("sessions").delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  db.close();
}
export function validateSession(value: unknown): Session {
  if (!value || typeof value !== "object") throw Error("Invalid session");
  const s = value as Session;
  if (
    s.version !== 1 ||
    typeof s.id !== "string" ||
    !Array.isArray(s.samples) ||
    s.samples.length > SESSION_LIMIT ||
    !Array.isArray(s.events) ||
    s.events.length > 500 ||
    !s.settings ||
    !["none", "demo", "camera", "image", "video", "session"].includes(s.source)
  )
    throw Error("Unsupported session format");
  for (const r of s.samples) {
    if (
      !r ||
      typeof r.face_id !== "string" ||
      !Number.isFinite(r.timestamp) ||
      !Number.isFinite(r.center_x) ||
      !Number.isFinite(r.center_y)
    )
      throw Error("Invalid tracking samples");
    for (const v of Object.values(r)) {
      if (typeof v === "number" && !Number.isFinite(v))
        throw Error("Non-finite sample value");
    }
  }
  return s;
}
