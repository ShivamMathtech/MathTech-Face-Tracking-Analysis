import { useEffect, useRef } from "react";
import {
  Camera as CameraIcon,
  Video,
  Upload,
  Square,
  Play,
  Pause,
  ScanLine,
  Maximize,
  StepForward,
  Download,
} from "lucide-react";
import { engine, useEngine } from "../services/engine";
import { overlay } from "../core/overlay";
import { Panel, fmt } from "./Common";
export function Camera() {
  const s = useEngine();
  const canvas = useRef<HTMLCanvasElement>(null),
    file = useRef<HTMLInputElement>(null),
    area = useRef<HTMLDivElement>(null);
  const active = !["none", "session"].includes(s.source);
  const t = engine.selected();
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 33) return;
      last = now;
      const c = canvas.current;
      if (!c) return;
      if (c.width !== engine.raw.width || c.height !== engine.raw.height) {
        c.width = engine.raw.width;
        c.height = engine.raw.height;
      }
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(engine.raw, 0, 0);
      if (engine.state.tracking)
        overlay(
          ctx,
          engine.state.tracks,
          engine.state.settings,
          c.width,
          c.height,
          engine.state.locked,
        );
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void area.current?.requestFullscreen().catch((e) => engine.fail(e));
  };
  return (
    <Panel
      title="Live Camera Feed"
      className="camera-panel"
      action={
        <div className="camera-heading-actions">
          <span className={`status-dot ${active ? "" : "idle"}`} />
          <select
            aria-label="Camera device"
            value={s.cameraId}
            onFocus={() => void engine.devices()}
            onChange={(e) => {
              s.cameraId = e.target.value;
              engine.notify(true);
              if (s.source === "camera") void engine.camera(e.target.value);
            }}
          >
            <option value="">Webcam (Default)</option>
            {s.devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="camera-stage" ref={area}>
        <canvas
          ref={canvas}
          aria-label="Live source with tracking overlays"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const scale = Math.min(
              rect.width / s.width,
              rect.height / s.height,
            );
            const x =
                (e.clientX - rect.left - (rect.width - s.width * scale) / 2) /
                scale,
              y =
                (e.clientY - rect.top - (rect.height - s.height * scale) / 2) /
                scale;
            const hit = s.tracks.find(
              (t) =>
                t.status === "tracking" &&
                x >= t.bbox.x &&
                x <= t.bbox.x + t.bbox.width &&
                y >= t.bbox.y &&
                y <= t.bbox.y + t.bbox.height,
            );
            if (hit) {
              s.target = hit.id;
              if (s.locked) s.locked = hit.id;
              engine.notify(true);
            }
          }}
        />
        {!active && (
          <div className="camera-empty">
            <div className="scan-symbol">
              <ScanLine size={52} />
            </div>
            <h3>
              {s.source === "session"
                ? "Saved session loaded"
                : "Your vision. In focus."}
            </h3>
            <p>
              Connect a camera, open media, or explore the interactive demo.
            </p>
            <div className="button-row">
              <button className="primary" onClick={() => void engine.camera()}>
                <Video size={16} /> Start Camera
              </button>
              <button onClick={() => void engine.demo()}>Launch Demo</button>
            </div>
            <span>LOCAL PROCESSING · NO IDENTITY RECOGNITION</span>
          </div>
        )}
        {active && (
          <>
            <div className={`feed-badge ${s.source === "demo" ? "demo" : ""}`}>
              <span className="status-dot" />
              {s.source === "demo"
                ? "DEMO / SIMULATION"
                : s.paused
                  ? "SOURCE PAUSED"
                  : s.tracking
                    ? "TRACKING: ACTIVE"
                    : "TRACKING: OFF"}
            </div>
            <div className="face-badge">
              {s.locked ? "TARGET LOCKED" : (t?.id ?? "NO FACE")}
            </div>
            {t && t.status === "tracking" && (
              <div className="coordinate-card">
                <span>Face Center (x, y)</span>
                <strong>
                  {fmt(t.center.x, 0)},{" "}
                  {fmt(
                    s.settings.coordinates === "math"
                      ? s.height - t.center.y
                      : t.center.y,
                    0,
                  )}{" "}
                  px
                </strong>
                <span>Face Size (w × h)</span>
                <strong>
                  {fmt(t.bbox.width, 0)} × {fmt(t.bbox.height, 0)}
                </strong>
                <span>Detector Confidence</span>
                <strong>
                  {t.confidence === null
                    ? s.source === "demo"
                      ? "Synthetic data"
                      : "Not available"
                    : `${fmt(t.confidence * 100)}%`}
                </strong>
              </div>
            )}
            {s.status.includes("LOST") && (
              <div className="lost-banner">{s.status}</div>
            )}
            {s.modelStatus === "loading" && s.source !== "demo" && (
              <div className="loading-overlay">
                <span className="spinner" />
                <strong>Initializing Computer Vision Model…</strong>
                <span>Loading local detection and landmark models</span>
              </div>
            )}
          </>
        )}
        <button
          className="feed-fullscreen"
          aria-label="Fullscreen tracking"
          title="Fullscreen tracking"
          onClick={fullscreen}
        >
          <Maximize size={16} />
        </button>
      </div>
      <div className="feed-stats">
        <span>
          FPS: <b>{fmt(s.fps)}</b>
        </span>
        <span>
          {s.width} × {s.height}
        </span>
        <span>
          {s.source === "demo"
            ? "Synthetic data"
            : s.settings.backend
              ? "Backend vision"
              : "MediaPipe Face Landmarker"}
        </span>
        <span className="green">
          {s.tracking ? "Tracking: ON" : "Tracking: OFF"}
        </span>
      </div>
      <div className="camera-toolbar">
        <button
          title="Start camera"
          aria-label="Start camera"
          onClick={() => void engine.camera()}
        >
          <Video size={15} />
          <span>Camera</span>
        </button>
        <button onClick={() => file.current?.click()}>
          <Upload size={15} />
          <span>Open Media</span>
        </button>
        <button onClick={() => void engine.demo()}>Demo</button>
        <button
          disabled={!active}
          title="Pause or resume"
          aria-label="Pause or resume source"
          onClick={() => engine.pause()}
        >
          {s.paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <button
          disabled={!active}
          title="Stop source immediately"
          aria-label="Stop source"
          onClick={() => engine.stop()}
        >
          <Square size={14} />
        </button>
        <button
          disabled={!active}
          title="Capture annotated PNG"
          aria-label="Capture annotated PNG"
          onClick={() => engine.snapshot()}
        >
          <CameraIcon size={15} />
        </button>
        <span className="camera-state">
          {s.source === "camera"
            ? `Permission: ${s.permission}`
            : s.source === "demo"
              ? "Camera is off"
              : s.sourceName}
        </span>
        <input
          ref={file}
          data-testid="media-upload"
          type="file"
          className="sr-only"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void engine.upload(f);
            e.target.value = "";
          }}
        />
      </div>
      {s.source === "video" && (
        <div className="video-transport">
          <label>
            Seek
            <input
              aria-label="Video position"
              type="range"
              min="0"
              max={s.duration || 1}
              step=".01"
              value={s.mediaTime}
              onChange={(e) => engine.seek(Number(e.target.value))}
            />
          </label>
          <span>
            {fmt(s.mediaTime)} / {fmt(s.duration)} s
          </span>
          <select
            aria-label="Playback speed"
            value={s.speed}
            onChange={(e) => engine.speed(Number(e.target.value))}
          >
            {[0.25, 0.5, 1, 1.5, 2].map((n) => (
              <option key={n} value={n}>
                {n}×
              </option>
            ))}
          </select>
          <button
            aria-label="Step forward one thirtieth second"
            onClick={() => {
              if (!s.paused) engine.pause();
              engine.seek(engine.video.currentTime + 1 / 30);
            }}
          >
            <StepForward size={16} />
          </button>
        </div>
      )}
      {s.recordingVideo && (
        <div className="recording-bar">
          ● RECORDING RAW VIDEO{" "}
          <button
            onClick={() => {
              engine.stopRecording();
              engine.notify(true);
            }}
          >
            <Download size={14} /> Stop & save recording
          </button>
        </div>
      )}
    </Panel>
  );
}
