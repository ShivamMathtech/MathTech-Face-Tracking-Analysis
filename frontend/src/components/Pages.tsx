import { useEffect, useMemo, useState } from "react";
import { engine, useEngine, defaults } from "../services/engine";
import { Panel, Metric, fmt, Range, Toggle } from "./Common";
import { Spark } from "./Charts";
import { Imaging } from "./Imaging";
import {
  csv,
  download,
  listSessions,
  deleteSession,
  statistics,
  validateSession,
} from "../core/session";
import type { Sample, Session, Settings } from "../types";
export { Imaging };
export function Analytics() {
  const s = useEngine();
  const [landmark, setLandmark] = useState("nose");
  const [raw, setRaw] = useState(true);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const chosen = s.locked ?? s.target;
  const records = useMemo(
    () =>
      s.session.samples.filter(
        (r) => chosen === "auto" || r.face_id === chosen,
      ),
    [pulse, chosen, s.session.id],
  );
  const stats = useMemo(() => statistics(records), [records]);
  const t = engine.selected();
  const current = t?.status === "tracking" ? t.sample : undefined;
  const history = t?.history ?? [];
  const latest = history.at(-1),
    prev = history.at(-2);
  const xKey = `${landmark}_x` as keyof Sample,
    yKey = `${landmark}_y` as keyof Sample;
  const lmDx = latest && prev ? Number(latest[xKey]) - Number(prev[xKey]) : 0,
    lmDy = latest && prev ? Number(latest[yKey]) - Number(prev[yKey]) : 0;
  const dt = latest && prev ? (latest.timestamp - prev.timestamp) / 1000 : 0;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MEASUREMENT WORKSPACE</p>
          <h1>Session Analytics</h1>
          <p>Explore tracked movement, pose and geometric facial signals.</p>
        </div>
        <button onClick={() => engine.export("report")}>Download report</button>
      </div>
      <div className="stat-grid">
        {[
          ["Samples", stats.samples],
          ["Tracked faces", stats.faces],
          ["Duration", `${fmt(stats.duration_seconds)} s`],
          [
            "Average confidence",
            stats.average_confidence === null
              ? "N/A"
              : `${fmt(stats.average_confidence * 100)}%`,
          ],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <label className="inline-field">
        Analysis target
        <select
          value={chosen}
          onChange={(e) => {
            s.target = e.target.value;
            s.locked = null;
            engine.notify(true);
          }}
        >
          <option value="auto">All faces (aggregate statistics)</option>
          {Array.from(new Set(s.session.samples.map((r) => r.face_id))).map(
            (id) => (
              <option key={id}>{id}</option>
            ),
          )}
        </select>
      </label>
      {!records.length && (
        <div className="notice">
          No tracking data. Start a source to generate analytics.
        </div>
      )}
      <div className="two-col">
        <Panel title="Movement Statistics">
          <div className="padded">
            {Object.entries({
              total_distance: stats.total_distance,
              average_velocity: stats.average_velocity,
              maximum_velocity: stats.maximum_velocity,
              average_face_area: stats.average_area,
            }).map(([k, v]) => (
              <Metric
                key={k}
                label={k.replaceAll("_", " ")}
                value={`${fmt(v)} ${k.includes("area") ? "px²" : k.includes("velocity") ? "px/s" : "px"}`}
              />
            ))}
            <Metric
              label="Acceleration (current)"
              value={`${fmt(current?.acceleration)} px/s²`}
            />
            <Metric
              label="Direction (image coordinates)"
              value={`${fmt(current?.direction)}°`}
            />
            <Spark
              field="velocity"
              label="Speed · selected face / px per second"
            />
          </div>
        </Panel>
        <Panel title="Pose Statistics · estimates">
          <div className="padded">
            {(["yaw", "pitch", "roll"] as const).map((axis) => (
              <Metric
                key={axis}
                label={`${axis} · mean / peak magnitude`}
                value={`${fmt(stats[`average_${axis}`])}° / ${fmt(stats[`maximum_${axis}`])}°`}
              />
            ))}
            <Spark field="yaw" label="Yaw / degrees" color="#16e1ad" />
            <Spark field="pitch" label="Pitch / degrees" color="#b275ff" />
          </div>
        </Panel>
        <Panel title="Raw / Smoothed Position">
          <div className="padded">
            <Toggle
              label="Show raw measurement comparison"
              value={raw}
              onChange={setRaw}
            />
            <Spark field="center_x" label="Horizontal center / px" raw={raw} />
            <Spark field="center_y" label="Vertical center / px" raw={raw} />
            <p className="muted">
              Blue: EMA-smoothed center · orange dashed: raw center. Select one
              face for individual graphs.
            </p>
          </div>
        </Panel>
        <Panel title="Landmark Movement">
          <div className="padded">
            <label>
              Landmark
              <select
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              >
                {["nose", "left_eye", "right_eye", "mouth", "chin"].map((n) => (
                  <option key={n} value={n}>
                    {n.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <Metric
              label="X / Y"
              value={
                current
                  ? `${fmt(Number(current[xKey]))}, ${fmt(Number(current[yKey]))} px`
                  : "—"
              }
            />
            <Metric label="ΔX / ΔY" value={`${fmt(lmDx)}, ${fmt(lmDy)} px`} />
            <Metric
              label="Velocity"
              value={`${fmt(dt > 0 ? Math.hypot(lmDx, lmDy) / dt : 0)} px/s`}
            />
            <Spark
              field={xKey}
              label="Landmark X trajectory / px"
              color="#b275ff"
            />
            <Metric
              label="Eye opening ratio"
              value={fmt(current?.eye_ratio, 3)}
            />
            <Metric
              label="Mouth opening ratio"
              value={fmt(current?.mouth_ratio, 3)}
            />
            <Metric
              label="Blink blendshape L / R"
              value={
                current
                  ? `${fmt(current.blink_left, 3)} / ${fmt(current.blink_right, 3)}`
                  : "—"
              }
            />
            <p className="muted">
              Geometric movement signals. These do not describe emotions,
              health, or identity.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
export function SettingsPage() {
  const s = useEngine(),
    v = s.settings;
  const set = engine.setSettings.bind(engine);
  const backendAllowed = import.meta.env.VITE_ENABLE_BACKEND === "true";
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ENGINE CONFIGURATION</p>
          <h1>Model Settings</h1>
          <p>
            Settings are saved on this device and applied to the active engine.
          </p>
        </div>
        <button onClick={() => set({ ...defaults })}>Restore defaults</button>
      </div>
      <div className="settings-grid">
        <Panel title="Detection">
          <div className="padded">
            <Range
              label="Detection confidence"
              value={v.threshold}
              min={0.1}
              max={0.95}
              onChange={(threshold) => set({ threshold })}
            />
            <Range
              label="Maximum faces"
              value={v.maxFaces}
              min={1}
              max={5}
              step={1}
              onChange={(maxFaces) => set({ maxFaces })}
            />
            <Range
              label="Minimum face size"
              value={v.minSize}
              min={10}
              max={150}
              step={5}
              unit=" px"
              onChange={(minSize) => set({ minSize })}
            />
            <p className="muted">
              Confidence is the separate face detector score. Unmatched landmark
              faces display N/A.
            </p>
          </div>
        </Panel>
        <Panel title="Temporal Tracking">
          <div className="padded">
            <Range
              label="EMA smoothing"
              value={v.smoothing}
              max={0.9}
              onChange={(smoothing) => set({ smoothing })}
            />
            <Range
              label="Association sensitivity"
              value={v.sensitivity}
              min={0.3}
              max={2}
              step={0.1}
              onChange={(sensitivity) => set({ sensitivity })}
            />
            <Range
              label="Lost face timeout"
              value={v.lostTimeout}
              min={250}
              max={5000}
              step={250}
              unit=" ms"
              onChange={(lostTimeout) => set({ lostTimeout })}
            />
            <Toggle
              label="Attempt reacquisition"
              value={v.reacquire}
              onChange={(reacquire) => set({ reacquire })}
            />
            <label>
              Trail length
              <select
                value={v.trail}
                onChange={(e) => set({ trail: Number(e.target.value) })}
              >
                {[0, 10, 25, 50, 100, 1800].map((n) => (
                  <option key={n} value={n}>
                    {n === 1800 ? "Full retained history (1800)" : n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Visualization">
          <div className="padded">
            {(
              [
                "bbox",
                "landmarks",
                "center",
                "crosshair",
                "labels",
                "axes",
                "movement",
                "pose",
                "vector",
                "graphs",
              ] as const
            ).map((k) => (
              <Toggle
                key={k}
                label={
                  {
                    bbox: "Bounding box",
                    landmarks: "Facial landmarks",
                    center: "Center point",
                    crosshair: "Crosshair",
                    labels: "Coordinates and labels",
                    axes: "Coordinate axes",
                    movement: "Movement trail",
                    pose: "Pose axes",
                    vector: "Velocity vector",
                    graphs: "Movement graphs",
                  }[k]
                }
                value={v[k]}
                onChange={(value) => set({ [k]: value })}
              />
            ))}
            <label>
              Coordinate system
              <select
                value={v.coordinates}
                onChange={(e) =>
                  set({
                    coordinates: e.target.value as Settings["coordinates"],
                  })
                }
              >
                <option value="image">Image · origin top-left / Y down</option>
                <option value="math">Mathematical · bottom-left / Y up</option>
              </select>
            </label>
            <label>
              Theme
              <select
                value={v.theme}
                onChange={(e) =>
                  set({ theme: e.target.value as Settings["theme"] })
                }
              >
                {["dark", "light", "system"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
        </Panel>
        <Panel title="Performance & Camera">
          <div className="padded">
            <Range
              label="Target frame rate"
              value={v.fps}
              min={5}
              max={30}
              step={5}
              unit=" FPS"
              onChange={(fps) => set({ fps })}
            />
            <Range
              label="Skip between processed frames"
              value={v.frameSkip}
              min={0}
              max={4}
              step={1}
              onChange={(frameSkip) => set({ frameSkip })}
            />
            <label>
              Requested camera resolution
              <select
                value={v.resolution}
                onChange={(e) => set({ resolution: e.target.value })}
              >
                {["640x480", "1280x720", "1920x1080"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <button className="wide" onClick={() => void engine.camera()}>
              Apply resolution & restart camera
            </button>
            <Metric
              label="Detection latency"
              value={`${fmt(s.detectionMs)} ms`}
            />
            <Metric
              label="Tracking latency"
              value={`${fmt(s.trackingMs, 2)} ms`}
            />
            <Metric
              label="Processing engine"
              value={v.backend ? "Backend" : "Local CPU worker"}
            />
            <p className="muted">
              Resolution is a browser constraint, not a guarantee. Actual
              dimensions appear below the camera. Physical distances require
              calibrated hardware; this app exports pixels and relative depth
              only.
            </p>
          </div>
        </Panel>
        <Panel title="Movement Heatmap">
          <div className="padded">
            <Toggle
              label="Show movement heatmap"
              value={v.heatmap}
              onChange={(heatmap) => set({ heatmap })}
            />
            <Range
              label="Intensity"
              value={v.heatIntensity}
              min={0.2}
              max={3}
              step={0.2}
              onChange={(heatIntensity) => set({ heatIntensity })}
            />
            <Range
              label="Decay time"
              value={v.heatDecay}
              min={1}
              max={60}
              step={1}
              unit=" s"
              onChange={(heatDecay) => set({ heatDecay })}
            />
            <p className="muted">
              Shows where each face center was observed within retained history.
            </p>
          </div>
        </Panel>
        <Panel title="Privacy & Recording">
          <div className="padded">
            <Toggle
              label="Auto-save numeric sessions locally"
              value={v.autoSave}
              onChange={(autoSave) => set({ autoSave })}
            />
            <p className="muted">
              Camera frames stay in your browser. Only explicit screenshots or
              video recording save images. Sessions contain face geometry;
              delete them from Export when no longer needed.
            </p>
            <button
              disabled={s.source !== "camera"}
              className={s.recordingVideo ? "danger wide" : "wide"}
              onClick={() => {
                if (s.recordingVideo) engine.stopRecording();
                else engine.startRecording();
                engine.notify(true);
              }}
            >
              {s.recordingVideo
                ? "Stop & download raw video"
                : "Start raw video recording"}
            </button>
            {backendAllowed ? (
              <>
                <Toggle
                  label="Send frames to configured backend"
                  value={v.backend}
                  onChange={(backend) => {
                    engine.stop();
                    set({ backend });
                    engine.log(
                      backend
                        ? "Backend processing selected: frames will be sent to your configured API"
                        : "Browser-local processing selected",
                    );
                  }}
                />
                <p className="muted">
                  Enabling this sends source frames to{" "}
                  {import.meta.env.VITE_API_URL}. Reopen your source to apply.
                </p>
              </>
            ) : (
              <p className="muted">
                Optional backend is disabled. Enable it explicitly in .env to
                expose remote processing controls.
              </p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
export function ExportPage() {
  const s = useEngine();
  const [saved, setSaved] = useState<Session[]>([]),
    [scope, setScope] = useState("session");
  const refresh = () =>
    void listSessions()
      .then(setSaved)
      .catch((e) => engine.fail(e));
  useEffect(refresh, []);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR DATA, YOUR DEVICE</p>
          <h1>Sessions & Export</h1>
          <p>Save, inspect, and export the measurements you choose.</p>
        </div>
        <button className="primary" onClick={() => engine.reset()}>
          Start New Session
        </button>
      </div>
      <div className="two-col">
        <Panel title="Current Session">
          <div className="padded">
            <Metric label="Session ID" value={s.session.id.slice(0, 8)} />
            <Metric label="Source" value={s.session.source} />
            <Metric
              label="Started"
              value={new Date(s.session.start_time).toLocaleString()}
            />
            <Metric label="Samples" value={s.session.samples.length} />
            <Metric
              label="State"
              value={
                s.session.end_time
                  ? "Ended"
                  : s.recordingData
                    ? "Recording data"
                    : "Paused"
              }
            />
            <Metric label="Retention limit" value="100,000 samples" />
            <div className="button-row">
              <button
                disabled={!!s.session.end_time}
                onClick={() => {
                  s.recordingData = !s.recordingData;
                  engine.tracker.rebase();
                  engine.notify(true);
                }}
              >
                {s.recordingData ? "Pause Session" : "Resume Session"}
              </button>
              <button onClick={() => engine.endSession()}>End Session</button>
              <button
                className="primary"
                onClick={() => void engine.save().then(refresh)}
              >
                Save Session
              </button>
            </div>
          </div>
        </Panel>
        <Panel title="Export Measurements">
          <div className="padded">
            <label>
              Export scope
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="session">
                  Current session / retained history
                </option>
                <option value="frame">Current frame</option>
                <option value="summary">Analytics summary (JSON)</option>
              </select>
            </label>
            <div className="export-grid">
              <button
                disabled={scope === "summary"}
                onClick={() => engine.export("csv", scope)}
              >
                CSV data
              </button>
              <button onClick={() => engine.export("json", scope)}>
                JSON session
              </button>
              <button onClick={() => engine.export("report", scope)}>
                Tracking report
              </button>
              <button
                onClick={() =>
                  download(
                    JSON.stringify(s.session.events, null, 2),
                    "mathtech-events.json",
                  )
                }
              >
                Event log
              </button>
              <button
                disabled={["none", "session"].includes(s.source)}
                onClick={() => engine.snapshot(true)}
              >
                Annotated PNG
              </button>
              <button
                disabled={["none", "session"].includes(s.source)}
                onClick={() => engine.snapshot(false)}
              >
                Raw PNG
              </button>
            </div>
            <p className="muted">
              Exported coordinates use the source image origin at top-left. ΔZ
              is a dimensionless apparent-size ratio. Exports honor the selected
              target; choose Auto to export all faces.
            </p>
          </div>
        </Panel>
      </div>
      <Panel
        title="Saved on This Device"
        action={
          <label className="upload-button">
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 100 * 1024 * 1024)
                    throw Error("Session JSON exceeds 100 MB.");
                  const data = validateSession(JSON.parse(await f.text()));
                  await engine.load(data);
                } catch (error) {
                  engine.fail(error);
                }
                e.target.value = "";
              }}
            />
          </label>
        }
      >
        <div className="padded">
          {saved.length ? (
            saved.map((item) => (
              <div className="saved-session" key={item.id}>
                <div>
                  <strong>
                    {item.source.toUpperCase()} · {item.id.slice(0, 8)}
                  </strong>
                  <p>
                    {new Date(item.start_time).toLocaleString()} ·{" "}
                    {item.samples.length} samples
                  </p>
                </div>
                <div className="button-row">
                  <button onClick={() => void engine.load(item)}>Load</button>
                  <button
                    onClick={() =>
                      download(
                        JSON.stringify(item, null, 2),
                        `mathtech-${item.id}.json`,
                      )
                    }
                  >
                    Download
                  </button>
                  <button
                    className="danger"
                    onClick={() => void deleteSession(item.id).then(refresh)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              No saved sessions yet. Save the current session to keep its
              numeric data after refresh.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
export function Help() {
  return (
    <div className="page help-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MATHTECH · I HAVE NO LIMITATION</p>
          <h1>Inside the Vision Lab</h1>
          <p>Understand what the system measures and how to use it.</p>
        </div>
      </div>
      <div className="two-col">
        <Panel title="Start in Three Steps">
          <div className="padded">
            <ol>
              <li>
                Click <b>Start Camera</b> and allow camera permission, or choose{" "}
                <b>Open Media</b>. Demo uses synthetic data and never opens a
                camera.
              </li>
              <li>
                Select a face in the feed or target menu. <b>Lock Face</b> keeps
                that temporary track selected.
              </li>
              <li>
                Inspect graphs and image views, then save a session or export
                CSV, JSON, or a snapshot.
              </li>
            </ol>
            <p>
              Use a recent Chrome or Edge browser on localhost or HTTPS. A
              file:// URL cannot run the worker or camera correctly.
            </p>
          </div>
        </Panel>
        <Panel title="Keyboard Shortcuts">
          <div className="padded shortcuts">
            {Object.entries({
              Space: "Pause / resume source",
              L: "Lock or unlock selected face",
              U: "Unlock face",
              R: "Start new session",
              C: "Capture annotated PNG",
              E: "Export CSV",
              F: "Fullscreen",
              T: "Toggle tracking",
              G: "Toggle graphs",
              M: "Toggle landmarks",
            }).map(([k, v]) => (
              <div key={k}>
                <kbd>{k}</kbd>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      {[
        [
          "How do face IDs and locking work?",
          "IDs are temporary spatial tracks, reset for every source/session. Association compares predicted center, box overlap and size; it does not recognize a person. A lost face can reacquire within the configured timeout. Crossings, occlusion and re-entry can exchange or reset IDs. A lock never silently switches to another track after expiry.",
        ],
        [
          "What do coordinates, movement and smoothing mean?",
          "The bounding box center is x + width/2, y + height/2. Displacement is the difference between successive centers, speed is pixel distance divided by elapsed seconds, and acceleration is the change in speed per second. EMA smooths boxes; raw centers are retained. UI coordinates can invert Y; exports always use image coordinates.",
        ],
        [
          "Are depth, pose and thermal measurements physical sensor readings?",
          "No. Relative depth is initial face-box width divided by current width, so turning the head can change it. Head pose is an estimate from the model transformation matrix. The 3D head is an orientation visualizer, not a reconstructed biometric model. Thermal uses RGB intensity false colors and has no temperature units. Night vision is an enhanced RGB image.",
        ],
        [
          "How does segmentation work?",
          "The face-oval landmarks form a polygon mask. Face/background masks, face-only view and overlays are geometric segmentation. Hair, ears and occluded regions are not a learned portrait segmentation mask. Depth rendering is a stylized face-centered gradient, not a sensor depth map.",
        ],
        [
          "Where are sessions and frames stored?",
          "Frames are processed in a local web worker by default. Numeric sessions remain in memory until you explicitly save or enable auto-save; IndexedDB keeps saved sessions on this device. Raw video is only captured after Start raw video recording. There is no identity database, analytics telemetry or default frame upload.",
        ],
        [
          "Why is confidence sometimes N/A?",
          "The landmarker does not expose a calibrated per-face detection confidence. This app runs a separate face detector and associates its score by bounding-box overlap. If no score matches, it shows N/A instead of fabricating a percentage. Demo data has no detection confidence.",
        ],
        [
          "How do uploaded videos and sessions behave?",
          "Uploaded media is decoded locally by your browser. Video velocities use source-video timestamps even at a different playback speed. Seeking starts a new numeric session to avoid joining incompatible timelines. Frame step advances by 1/30 second, which is approximate rather than codec-frame accurate. A loaded saved session is an analytics dataset; raw frames are not embedded.",
        ],
        [
          "Troubleshooting",
          "If model loading fails, verify public/models and public/wasm exist and serve the app over localhost. npm ci restores the local WASM files. For denied permissions, allow camera access in browser site settings. For slow processing reduce maximum faces, target FPS or camera resolution. No GPU or network inference service is required for local mode.",
        ],
      ].map(([q, a]) => (
        <details className="help-detail" key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
      <p className="credit">
        Developed for MathTech · Shivam Singh, Founder of MathTech
      </p>
    </div>
  );
}
