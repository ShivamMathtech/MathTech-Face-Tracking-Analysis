import { useSyncExternalStore } from "react";
import type {
  Detection,
  Session,
  Settings,
  SourceKind,
  State,
  Track,
} from "../types";
import { GROUPS } from "../core/math";
import { Tracker } from "../core/tracker";
import {
  csv,
  download,
  newSession,
  saveSession,
  SESSION_LIMIT,
  statistics,
  validateSession,
} from "../core/session";
import { demoFrame } from "../core/demo";
import { overlay } from "../core/overlay";
export const defaults: Settings = {
  threshold: 0.6,
  maxFaces: 3,
  minSize: 30,
  smoothing: 0.45,
  lostTimeout: 1500,
  sensitivity: 1.15,
  reacquire: true,
  trail: 100,
  fps: 30,
  frameSkip: 0,
  resolution: "1280x720",
  coordinates: "image",
  bbox: true,
  landmarks: true,
  center: true,
  crosshair: false,
  labels: true,
  axes: true,
  movement: true,
  pose: false,
  vector: false,
  graphs: true,
  heatmap: false,
  heatIntensity: 1,
  heatDecay: 10,
  theme: "dark",
  autoSave: false,
  groups: Object.keys(GROUPS),
  backend: false,
};
function storedSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("mathtech-settings") ?? "{}");
    return { ...defaults, ...saved, backend: false } as Settings;
  } catch {
    return { ...defaults };
  }
}
export class Engine {
  raw = document.createElement("canvas");
  video = document.createElement("video");
  picture: HTMLImageElement | null = null;
  tracker = new Tracker();
  stream: MediaStream | null = null;
  worker: Worker | null = null;
  workerReady: Promise<void> | null = null;
  listeners = new Set<() => void>();
  state: State;
  lastNotify = 0;
  lastFrame = 0;
  lastAccepted = 0;
  forceNextFrame = false;
  lastMediaTime = -1;
  busy = false;
  epoch = 0;
  sourceRequest = 0;
  sampleTime = 0;
  objectUrl = "";
  lastSave = 0;
  frameIndex = 0;
  recorder: MediaRecorder | null = null;
  recorded: Blob[] = [];
  recordingCanvas: HTMLCanvasElement | null = null;
  constructor() {
    const settings = storedSettings();
    this.raw.width = 960;
    this.raw.height = 600;
    this.video.muted = true;
    this.video.playsInline = true;
    this.state = {
      source: "none",
      sourceName: "No source selected",
      status: "Ready to connect",
      modelStatus: "idle",
      error: "",
      paused: false,
      tracking: true,
      permission: "Not requested",
      width: 960,
      height: 600,
      fps: 0,
      detectionMs: 0,
      trackingMs: 0,
      tracks: [],
      target: "auto",
      locked: null,
      settings,
      session: newSession(settings),
      recordingData: true,
      recordingVideo: false,
      logs: [],
      logPaused: false,
      graphPaused: false,
      graphWindow: 10,
      devices: [],
      cameraId: "",
      mediaTime: 0,
      duration: 0,
      speed: 1,
      revision: 0,
    };
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    this.video.onended = () => {
      this.state.paused = true;
      this.state.status = "Video ended";
      this.notify(true);
    };
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  get = () => this.state;
  notify(force = false) {
    const now = performance.now();
    if (!force && now - this.lastNotify < 180) return;
    this.lastNotify = now;
    this.state = { ...this.state, revision: this.state.revision + 1 };
    this.listeners.forEach((f) => f());
  }
  log(message: string, level: "info" | "warning" | "error" = "info") {
    if (this.state.logPaused) return;
    const entry = { message, level, time: new Date().toISOString() };
    this.state.logs = [entry, ...this.state.logs].slice(0, 120);
    this.state.session.events.push(entry);
    if (this.state.session.events.length > 500)
      this.state.session.events.shift();
  }
  fail(e: unknown) {
    this.state.error = e instanceof Error ? e.message : String(e);
    this.log(this.state.error, "error");
    this.notify(true);
  }
  selected(): Track | undefined {
    const id = this.state.locked ?? this.state.target;
    return id === "auto"
      ? [...this.state.tracks]
          .filter((t) => t.status === "tracking")
          .sort(
            (a, b) =>
              b.bbox.width * b.bbox.height - a.bbox.width * a.bbox.height,
          )[0]
      : this.state.tracks.find((t) => t.id === id);
  }
  setSettings(patch: Partial<Settings>) {
    this.state.settings = { ...this.state.settings, ...patch };
    localStorage.setItem(
      "mathtech-settings",
      JSON.stringify(this.state.settings),
    );
    if (
      this.worker &&
      this.state.modelStatus === "ready" &&
      ("threshold" in patch || "maxFaces" in patch)
    )
      this.worker.postMessage({
        type: "settings",
        settings: this.state.settings,
      });
    this.state.session.settings = structuredClone(this.state.settings);
    this.lastMediaTime = -1;
    this.notify(true);
  }
  async initModel() {
    if (this.state.settings.backend) return;
    if (this.state.modelStatus === "ready") return;
    if (this.workerReady) return this.workerReady;
    this.state.modelStatus = "loading";
    this.state.status = "Initializing computer vision model…";
    this.state.error = "";
    this.notify(true);
    this.workerReady = new Promise<void>((resolve, reject) => {
      this.worker = new Worker(
        new URL(
          "vision-worker.js",
          new URL(import.meta.env.BASE_URL, location.href),
        ),
      );
      const timer = setTimeout(() => {
        reject(
          Error(
            "Vision model loading timed out. Use the bundled models and serve this app over localhost.",
          ),
        );
        this.worker?.terminate();
        this.workerReady = null;
        this.state.modelStatus = "error";
        this.fail("Computer vision model failed to initialize.");
      }, 90000);
      this.worker.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.type === "ready") {
          clearTimeout(timer);
          this.state.modelStatus = "ready";
          this.state.status = "Vision engine ready";
          this.log("Local vision engine initialized");
          this.notify(true);
          resolve();
        } else if (m.type === "result") {
          this.busy = false;
          if (m.epoch !== this.epoch) return;
          this.state.detectionMs = m.latency;
          this.accept(m.faces, this.sampleTime);
        } else if (m.type === "error") {
          clearTimeout(timer);
          this.busy = false;
          this.state.modelStatus = "error";
          this.workerReady = null;
          this.worker?.terminate();
          this.worker = null;
          this.fail(`Computer vision model: ${m.error}`);
          reject(Error(m.error));
        }
      };
      this.worker.onerror = () => {
        clearTimeout(timer);
        this.busy = false;
        this.state.modelStatus = "error";
        this.workerReady = null;
        this.fail("Vision worker failed. Use a recent Chrome or Edge browser.");
        reject(Error("Vision worker failed"));
      };
      this.worker.postMessage({
        type: "init",
        settings: this.state.settings,
        base: new URL(import.meta.env.BASE_URL, location.href).href,
      });
    });
    return this.workerReady;
  }
  async devices() {
    if (navigator.mediaDevices) {
      this.state.devices = (
        await navigator.mediaDevices.enumerateDevices()
      ).filter((d) => d.kind === "videoinput");
      this.notify(true);
    }
  }
  stop() {
    this.sourceRequest++;
    this.epoch++;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.stopRecording();
    this.video.pause();
    this.video.srcObject = null;
    this.video.removeAttribute("src");
    this.video.load();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = "";
    this.picture = null;
    this.state.source = "none";
    this.state.sourceName = "No source selected";
    this.state.status = "Source stopped";
    this.state.tracks = [];
    this.state.paused = false;
    this.state.fps = 0;
    this.lastMediaTime = -1;
    this.tracker.reset();
    this.raw.getContext("2d")!.clearRect(0, 0, this.raw.width, this.raw.height);
    this.notify(true);
  }
  async begin(kind: SourceKind, name: string) {
    if (this.state.settings.autoSave && this.state.session.samples.length)
      await this.save();
    this.stop();
    this.state.source = kind;
    this.state.sourceName = name;
    this.state.target = "auto";
    this.state.locked = null;
    this.state.error = "";
    this.state.session = newSession(this.state.settings, kind, name);
    this.state.logs = [];
    this.state.recordingData = true;
    this.state.duration = 0;
    this.state.mediaTime = 0;
    this.state.status =
      kind === "demo" ? "Demo / simulation mode" : "Preparing source…";
    this.log(`New ${kind} session: ${name}`);
    this.notify(true);
  }
  async camera(id = this.state.cameraId) {
    try {
      await this.begin("camera", "Webcam");
      const request = this.sourceRequest;
      this.state.permission = "Requesting permission";
      if (!navigator.mediaDevices?.getUserMedia)
        throw Error("Camera unavailable. Open on localhost or HTTPS.");
      const [width, height] = this.state.settings.resolution
        .split("x")
        .map(Number);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          deviceId: id ? { exact: id } : undefined,
          width: { ideal: width },
          height: { ideal: height },
        },
      });
      if (request !== this.sourceRequest) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      this.state.permission = "Granted";
      this.state.sourceName = stream.getVideoTracks()[0]?.label ?? "Webcam";
      this.state.session.camera = this.state.sourceName;
      this.video.srcObject = stream;
      await this.video.play();
      await this.devices();
      this.state.cameraId =
        stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
      await this.initModel();
      this.state.status = "Live camera connected";
      this.notify(true);
    } catch (e) {
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.state.source = "none";
      this.state.permission =
        e instanceof DOMException ? e.name : "Unavailable";
      this.fail(
        `Camera unavailable. Check browser permissions or select another camera. ${e instanceof Error ? e.message : ""}`,
      );
    }
  }
  async demo() {
    if (import.meta.env.VITE_ENABLE_DEMO_MODE === "false") return;
    await this.begin("demo", "Synthetic subjects");
  }
  async upload(file: File) {
    try {
      if (file.size > 250 * 1024 * 1024)
        throw Error("Media exceeds the 250 MB limit.");
      const image = ["image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      );
      const video = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ].includes(file.type);
      if (!image && !video)
        throw Error("Choose PNG, JPEG, WebP, MP4, WebM or Ogg media.");
      await this.begin(image ? "image" : "video", file.name);
      this.objectUrl = URL.createObjectURL(file);
      if (image) {
        this.picture = new Image();
        this.picture.src = this.objectUrl;
        await this.picture.decode();
        if (this.picture.naturalWidth * this.picture.naturalHeight > 40000000)
          throw Error("Image is too large. Resize it below 40 megapixels.");
      } else {
        this.video.src = this.objectUrl;
        await new Promise<void>((resolve, reject) => {
          this.video.onloadedmetadata = () => resolve();
          this.video.onerror = () =>
            reject(
              Error(
                "This browser cannot decode the video codec. Try an H.264 MP4 or WebM.",
              ),
            );
        });
        this.state.duration = this.video.duration;
      }
      await this.initModel();
      if (!image) await this.video.play();
      this.state.status = image ? "Analyzing image" : "Video playing";
      this.notify(true);
    } catch (e) {
      this.stop();
      this.fail(e);
    }
  }
  pause() {
    if (this.state.source === "none") return;
    this.state.paused = !this.state.paused;
    if (this.state.source === "camera" || this.state.source === "video") {
      if (this.state.paused) this.video.pause();
      else void this.video.play().catch((e) => this.fail(e));
    }
    if (!this.state.paused) this.tracker.rebase();
    this.log(this.state.paused ? "Source paused" : "Source resumed");
    this.notify(true);
  }
  seek(time: number) {
    if (this.state.source !== "video") return;
    this.epoch++;
    this.tracker.reset();
    this.state.tracks = [];
    this.state.locked = null;
    this.state.target = "auto";
    this.state.session = newSession(
      this.state.settings,
      "video",
      this.state.sourceName,
    );
    this.state.logs = [];
    this.log("Video seek: a new timeline session was started");
    this.video.currentTime = Math.min(this.state.duration, Math.max(0, time));
    this.lastMediaTime = -1;
    this.video.onseeked = () => {
      this.forceNextFrame = true;
      void this.processFrame(true);
    };
    this.notify(true);
  }
  speed(value: number) {
    this.state.speed = value;
    this.video.playbackRate = value;
    this.notify(true);
  }
  toggleTracking() {
    this.state.tracking = !this.state.tracking;
    this.tracker.rebase();
    if (!this.state.tracking) this.state.tracks = [];
    this.lastMediaTime = -1;
    this.notify(true);
  }
  lock() {
    const t = this.selected();
    if (this.state.locked) {
      this.state.locked = null;
      this.log("Target unlocked");
    } else if (t && t.status !== "lost") {
      this.state.locked = t.id;
      this.state.target = t.id;
      this.log(`Target locked: ${t.id}`);
    }
    this.notify(true);
  }
  reset() {
    this.epoch++;
    this.tracker.reset();
    this.state.tracks = [];
    this.state.locked = null;
    this.state.target = "auto";
    this.state.session = newSession(
      this.state.settings,
      this.state.source,
      this.state.sourceName,
    );
    this.state.recordingData = true;
    this.state.logs = [];
    this.lastMediaTime = -1;
    this.log("New session started");
    this.notify(true);
  }
  async save() {
    try {
      await saveSession(this.state.session);
      this.log("Session saved on this device");
      this.notify(true);
    } catch (e) {
      this.fail(e);
    }
  }
  endSession() {
    this.state.session.end_time = new Date().toISOString();
    this.state.recordingData = false;
    this.log("Session ended; exports remain available");
    this.notify(true);
  }
  async load(session: Session) {
    this.stop();
    this.state.session = validateSession(structuredClone(session));
    this.state.source = "session";
    this.state.sourceName = `Saved ${session.source} session`;
    this.state.logs = [...session.events].reverse();
    this.state.recordingData = false;
    this.state.status = "Saved session loaded";
    this.notify(true);
  }
  export(kind: "csv" | "json" | "report", scope = "session") {
    const s = this.state.session;
    const samples =
      scope === "frame"
        ? this.state.tracks
            .filter((t) => t.status === "tracking")
            .map((t) => t.sample)
        : s.samples;
    const id = this.state.locked ?? this.state.target;
    const chosen =
      id === "auto" ? samples : samples.filter((r) => r.face_id === id);
    if (kind === "csv")
      download(csv(chosen), `mathtech-${s.id}.csv`, "text/csv");
    else if (kind === "json")
      download(
        JSON.stringify(
          scope === "summary" ? statistics(chosen) : { ...s, samples: chosen },
          null,
          2,
        ),
        `mathtech-${s.id}.json`,
      );
    else {
      const data = statistics(chosen);
      download(
        `# MathTech Tracking Report\n\nPrepared by Shivam Singh, Founder of MathTech\n\nSession: ${s.id}\nSource: ${s.source}\nStarted: ${s.start_time}\nTarget: ${id}\nCoordinates: source pixels, origin top-left. Depth: relative width ratio, not metric.\n\n${Object.entries(
          data,
        )
          .map(
            ([k, v]) =>
              `- ${k.replaceAll("_", " ")}: ${typeof v === "number" ? v.toFixed(3) : (v ?? "not available")}`,
          )
          .join(
            "\n",
          )}\n\nSpatial association is not identity recognition. Crossing faces may exchange IDs.\n`,
        `mathtech-${s.id}-report.md`,
        "text/markdown",
      );
    }
    this.log(`Exported ${kind.toUpperCase()}`);
    this.notify(true);
  }
  snapshot(annotated = true) {
    if (this.state.source === "none" || this.state.source === "session") return;
    const c = document.createElement("canvas");
    c.width = this.raw.width;
    c.height = this.raw.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(this.raw, 0, 0);
    if (annotated) {
      overlay(
        ctx,
        this.state.tracks,
        this.state.settings,
        c.width,
        c.height,
        this.state.locked,
      );
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px monospace";
      ctx.fillText(
        `${this.state.source.toUpperCase()} · ${new Date().toISOString()}`,
        12,
        c.height - 14,
      );
    }
    c.toBlob((b) => {
      if (b)
        download(
          b,
          `mathtech-${annotated ? "annotated" : "raw"}-${Date.now()}.png`,
        );
    });
    this.log("Snapshot captured locally");
  }
  startRecording() {
    if (!this.stream || this.state.recordingVideo) return;
    try {
      if (!window.MediaRecorder)
        throw Error("Video recording is not supported in this browser.");
      this.recorded = [];
      this.recorder = new MediaRecorder(this.stream);
      this.recorder.ondataavailable = (e) => {
        if (e.data.size) this.recorded.push(e.data);
      };
      this.recorder.onstop = () => {
        download(
          new Blob(this.recorded, {
            type: this.recorder?.mimeType ?? "video/webm",
          }),
          `mathtech-recording-${Date.now()}.webm`,
        );
        this.recorded = [];
      };
      this.recorder.start(1000);
      this.state.recordingVideo = true;
      this.log("Raw video recording explicitly started");
      this.notify(true);
    } catch (e) {
      this.fail(e);
    }
  }
  stopRecording() {
    if (this.recorder && this.recorder.state !== "inactive")
      this.recorder.stop();
    this.state.recordingVideo = false;
  }
  accept(faces: Detection[], timestamp: number) {
    if (!this.state.tracking) return;
    const start = performance.now();
    if (this.lastAccepted)
      this.state.fps = 1000 / Math.max(1, start - this.lastAccepted);
    this.lastAccepted = start;
    const old = new Map(this.state.tracks.map((t) => [t.id, t.status]));
    this.state.tracks = this.tracker.update(
      faces,
      timestamp,
      this.state.settings,
      this.state.source,
    );
    this.state.trackingMs = performance.now() - start;
    for (const t of this.state.tracks) {
      if (!old.has(t.id)) this.log(`Face detected — ${t.id}`);
      else if (old.get(t.id) !== t.status)
        this.log(
          `${t.id} ${t.status === "lost" ? "temporarily lost" : "reacquired"}`,
          t.status === "lost" ? "warning" : "info",
        );
    }
    if (this.state.recordingData && !this.state.session.end_time) {
      const samples = this.state.tracks
        .filter((t) => t.status === "tracking")
        .map((t) => t.sample);
      if (this.state.session.samples.length + samples.length <= SESSION_LIMIT)
        this.state.session.samples.push(...samples);
      else {
        this.state.session.dropped_samples += samples.length;
        this.state.recordingData = false;
        this.log(
          "100,000 sample limit reached. Export and start a new session.",
          "warning",
        );
      }
    }
    this.state.status =
      this.state.locked &&
      !this.state.tracks.some(
        (t) => t.id === this.state.locked && t.status === "tracking",
      )
        ? "TARGET TEMPORARILY LOST · attempting reacquisition"
        : faces.length
          ? this.state.source === "demo"
            ? "DEMO / SIMULATION MODE"
            : "Tracking active"
          : "No face detected";
    this.notify();
  }
  async processFrame(force = false) {
    const s = this.state;
    if (
      this.busy ||
      (!force && s.paused) ||
      ["none", "session"].includes(s.source)
    )
      return;
    if (s.source === "demo") {
      const faces = demoFrame(
        this.raw,
        performance.now() / 1000,
        s.settings.maxFaces,
      );
      s.width = this.raw.width;
      s.height = this.raw.height;
      if (s.tracking) this.accept(faces, Date.now());
      return;
    }
    if (s.source !== "image" && this.video.readyState < 2) return;
    const source = this.picture ?? this.video;
    const w = this.picture?.naturalWidth ?? this.video.videoWidth,
      h = this.picture?.naturalHeight ?? this.video.videoHeight;
    if (!w || !h) return;
    const time = s.source === "image" ? 0 : this.video.currentTime;
    if (this.lastMediaTime === time && !force) return;
    this.lastMediaTime = time;
    this.forceNextFrame = false;
    this.raw.width = w;
    this.raw.height = h;
    this.raw.getContext("2d")!.drawImage(source, 0, 0, w, h);
    s.width = w;
    s.height = h;
    s.session.resolution = `${w}x${h}`;
    s.mediaTime = this.video.currentTime;
    if (!s.tracking || (!s.settings.backend && s.modelStatus !== "ready")) {
      this.lastMediaTime = -1;
      return;
    }
    this.busy = true;
    const epoch = this.epoch;
    this.sampleTime =
      s.source === "video"
        ? Date.parse(s.session.start_time) + this.video.currentTime * 1000
        : Date.now();
    try {
      if (s.settings.backend) {
        const blob = await new Promise<Blob>((resolve, reject) =>
          this.raw.toBlob(
            (b) => (b ? resolve(b) : reject(Error("Unable to encode frame"))),
            "image/jpeg",
            0.85,
          ),
        );
        const form = new FormData();
        form.append("file", blob, "frame.jpg");
        const start = performance.now();
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}/api/analyze/frame`,
          { method: "POST", body: form, signal: AbortSignal.timeout(15000) },
        );
        if (!response.ok) throw Error(`Backend returned ${response.status}`);
        const result = await response.json();
        this.busy = false;
        if (epoch === this.epoch) {
          s.detectionMs = performance.now() - start;
          this.accept(result.faces as Detection[], this.sampleTime);
        }
      } else {
        const bitmap = await createImageBitmap(this.raw);
        if (epoch !== this.epoch) {
          bitmap.close();
          this.busy = false;
          return;
        }
        this.worker!.postMessage(
          { type: "frame", bitmap, timestamp: performance.now(), epoch },
          [bitmap],
        );
      }
    } catch (e) {
      this.busy = false;
      this.state.paused = true;
      this.fail(e);
    }
  }
  loop(now: number) {
    requestAnimationFrame(this.loop);
    const interval = 1000 / this.state.settings.fps;
    if (now - this.lastFrame < interval) return;
    const dt = now - this.lastFrame;
    this.lastFrame = now;
    if (
      this.state.source === "none" ||
      this.state.paused ||
      this.state.source === "image"
    )
      this.state.fps = 0;
    this.frameIndex++;
    if (this.frameIndex % (this.state.settings.frameSkip + 1) === 0)
      void this.processFrame(this.forceNextFrame);
    if (
      this.state.settings.autoSave &&
      now - this.lastSave > 30000 &&
      this.state.session.samples.length
    ) {
      this.lastSave = now;
      void saveSession(this.state.session).catch((e) => this.fail(e));
    }
    this.notify();
  }
}
export const engine = new Engine();
export const useEngine = () =>
  useSyncExternalStore(engine.subscribe, engine.get);
