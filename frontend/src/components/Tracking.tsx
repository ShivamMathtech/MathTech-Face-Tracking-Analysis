import { useEffect, useRef } from "react";
import { Lock, Unlock, RotateCcw, Download, Pause, Play } from "lucide-react";
import { engine, useEngine } from "../services/engine";
import { Panel, Metric, fmt, signed, Toggle, Range } from "./Common";
import { GROUPS } from "../core/math";
import { Spark } from "./Charts";
export function FaceInfo() {
  const s = useEngine();
  const selected = engine.selected();
  const t = selected?.status === "tracking" ? selected : undefined;
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 90, 105);
    if (t)
      ctx.drawImage(
        engine.raw,
        t.bbox.x,
        t.bbox.y,
        t.bbox.width,
        t.bbox.height,
        0,
        0,
        90,
        105,
      );
  }, [s.revision, t]);
  return (
    <Panel title="Face Information" className="info-panel">
      <div className="face-overview">
        <canvas
          ref={ref}
          width={90}
          height={105}
          aria-label="Selected face crop"
        />
        <div>
          <Metric label="ID" value={t?.id ?? "—"} accent />
          <Metric
            label="Confidence"
            value={
              t?.confidence == null ? "N/A" : `${fmt(t.confidence * 100)}%`
            }
          />
          <Metric
            label="Center (x, y)"
            value={
              t
                ? `${fmt(t.center.x, 0)}, ${fmt(s.settings.coordinates === "math" ? s.height - t.center.y : t.center.y, 0)}`
                : "—"
            }
          />
          <Metric
            label="Size (w, h)"
            value={
              t ? `${fmt(t.bbox.width, 0)}, ${fmt(t.bbox.height, 0)}` : "—"
            }
          />
        </div>
      </div>
      <div className="info-section">
        <h3>
          Head Pose <small>(Euler estimates)</small>
        </h3>
        <Metric label="Yaw (Left/Right)" value={`${fmt(t?.pose.yaw)}°`} />
        <Metric label="Pitch (Up/Down)" value={`${fmt(t?.pose.pitch)}°`} />
        <Metric label="Roll (Tilt)" value={`${fmt(t?.pose.roll)}°`} />
      </div>
      <div className="info-section">
        <h3>
          Face Movement <small>(per sample)</small>
        </h3>
        <Metric
          label="X Movement"
          value={`${signed(t?.sample.delta_x)} px`}
          accent
        />
        <Metric
          label="Y Movement"
          value={`${signed(t ? t.sample.delta_y * (s.settings.coordinates === "math" ? -1 : 1) : undefined)} px`}
          accent
        />
        <Metric
          label="Relative ΔZ"
          value={signed(t?.sample.delta_z, 3)}
          accent
        />
        <Metric label="Speed" value={`${fmt(t?.sample.velocity)} px/s`} />
        <Spark field="velocity" label="Velocity history" color="#14efa6" />
      </div>
      <div className="info-foot">
        {s.source === "demo"
          ? "Synthetic measurements"
          : selected?.status === "lost"
            ? "Target lost · reacquiring"
            : t
              ? "Session ID · no identity recognition"
              : "Position a face inside the frame"}
      </div>
    </Panel>
  );
}
export function Controls() {
  const s = useEngine();
  const t = engine.selected();
  return (
    <Panel title="Tracking Controls" className="controls-panel">
      <div className="control-section">
        <Toggle
          label="Enable Tracking"
          value={s.tracking}
          onChange={() => engine.toggleTracking()}
        />
        <label>
          Target Face
          <select
            value={s.locked ?? s.target}
            onChange={(e) => {
              s.target = e.target.value;
              if (s.locked)
                s.locked = e.target.value === "auto" ? null : e.target.value;
              engine.notify(true);
            }}
          >
            <option value="auto">Auto (Largest Face)</option>
            {s.tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id}
                {t.status === "lost" ? " · lost" : ""}
              </option>
            ))}
            {s.locked && !s.tracks.some((t) => t.id === s.locked) && (
              <option value={s.locked}>{s.locked} · expired</option>
            )}
          </select>
        </label>
        <label>
          Tracking Mode
          <select
            value={s.settings.landmarks ? "mesh" : "box"}
            onChange={(e) =>
              engine.setSettings({ landmarks: e.target.value === "mesh" })
            }
          >
            <option value="mesh">Face + Landmarks</option>
            <option value="box">Face Bounding Box</option>
          </select>
        </label>
        <Range
          label="Detection Threshold"
          value={s.settings.threshold}
          min={0.1}
          max={0.95}
          onChange={(threshold) => engine.setSettings({ threshold })}
        />
        <Range
          label="Smoothing"
          value={s.settings.smoothing}
          max={0.9}
          onChange={(smoothing) => engine.setSettings({ smoothing })}
        />
      </div>
      <div className="control-section">
        <h3>Actions</h3>
        <button
          className="primary wide"
          disabled={!s.locked && (!t || t.status === "lost")}
          onClick={() => engine.lock()}
        >
          {s.locked ? <Unlock size={16} /> : <Lock size={16} />}{" "}
          {s.locked ? "Unlock Face" : "Lock Face"}
        </button>
        <button className="wide" onClick={() => engine.reset()}>
          <RotateCcw size={16} /> Reset Session
        </button>
        <button
          className="wide"
          disabled={s.source === "none"}
          onClick={() => engine.pause()}
        >
          {s.paused ? <Play size={16} /> : <Pause size={16} />}{" "}
          {s.paused ? "Resume" : "Pause"}
        </button>
        <button
          className="wide"
          disabled={!s.session.samples.length}
          onClick={() => engine.export("csv")}
        >
          <Download size={16} /> Export Data
        </button>
      </div>
    </Panel>
  );
}
export function Landmarks() {
  const s = useEngine();
  return (
    <Panel
      title="Tracked Points (Landmarks)"
      className="landmarks-panel"
      action={
        <div className="text-actions">
          <button
            onClick={() =>
              engine.setSettings({
                groups: Object.keys(GROUPS),
                landmarks: true,
              })
            }
          >
            Show all
          </button>
          <button onClick={() => engine.setSettings({ groups: [] })}>
            Hide all
          </button>
        </div>
      }
    >
      <div className="landmarks-list">
        {Object.keys(GROUPS).map((name) => (
          <label key={name}>
            <input
              type="checkbox"
              checked={s.settings.groups.includes(name)}
              onChange={(e) =>
                engine.setSettings({
                  groups: e.target.checked
                    ? [...s.settings.groups, name]
                    : s.settings.groups.filter((n) => n !== name),
                })
              }
            />
            {name}
          </label>
        ))}
      </div>
    </Panel>
  );
}
export function EventLog() {
  const s = useEngine();
  return (
    <Panel
      title="Data Log (Latest)"
      className="log-panel"
      action={
        <div className="text-actions">
          <button
            onClick={() => {
              s.logPaused = !s.logPaused;
              engine.notify(true);
            }}
          >
            {s.logPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => {
              s.logs = [];
              s.session.events = [];
              engine.notify(true);
            }}
          >
            Clear
          </button>
        </div>
      }
    >
      <div className="event-list" aria-live="polite">
        {s.logs.length ? (
          s.logs.slice(0, 4).map((l, i) => (
            <div className="event" key={`${l.time}-${i}`}>
              <span
                className={`status-dot ${l.level === "info" ? "" : l.level}`}
              />
              <span>{l.message}</span>
              <time>{new Date(l.time).toLocaleTimeString("en-GB")}</time>
            </div>
          ))
        ) : (
          <p className="muted">
            Waiting for a source. All processing is local.
          </p>
        )}
      </div>
    </Panel>
  );
}
