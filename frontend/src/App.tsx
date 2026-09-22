import { Component, lazy, Suspense, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Video,
  ChartNoAxesCombined,
  Image,
  Settings,
  Download,
  CircleHelp,
  Maximize,
  ShieldCheck,
  X,
  Menu,
  Activity,
} from "lucide-react";
import { engine, useEngine } from "./services/engine";
import { Camera } from "./components/Camera";
import { FaceInfo, Controls, Landmarks, EventLog } from "./components/Tracking";
import { MovementCharts } from "./components/Charts";
import { Imaging } from "./components/Imaging";
const HeadView = lazy(() => import("./components/HeadView"));
const Analytics = lazy(() =>
  import("./components/Pages").then((m) => ({ default: m.Analytics })),
);
const ModelSettings = lazy(() =>
  import("./components/Pages").then((m) => ({ default: m.SettingsPage })),
);
const Export = lazy(() =>
  import("./components/Pages").then((m) => ({ default: m.ExportPage })),
);
const Help = lazy(() =>
  import("./components/Pages").then((m) => ({ default: m.Help })),
);
const NAV = [
  ["Live Tracking", Video],
  ["Analytics", ChartNoAxesCombined],
  ["Image Processing", Image],
  ["Model Settings", Settings],
  ["Export", Download],
  ["Help", CircleHelp],
] as const;
function Logo() {
  return (
    <svg viewBox="0 0 46 44" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradient">
          <stop stopColor="#10d2ec" />
          <stop offset="1" stopColor="#1476ff" />
        </linearGradient>
      </defs>
      <path
        d="M3 38V5l7-3 13 15L36 2l7 3v33l-8-7V17L23 31 11 17v14z"
        fill="url(#logoGradient)"
      />
      <path d="m11 17 12 14 6-7L10 2 3 5z" fill="#0d81d8" />
      <path d="M35 17 43 5v33l-8-7z" fill="#154ccd" />
    </svg>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error("UI error", e, info);
  }
  render() {
    return this.state.error ? (
      <div className="error-page">
        <h1>Something went wrong</h1>
        <p>{this.state.error}</p>
        <button onClick={() => location.reload()}>Reload application</button>
        <button onClick={() => engine.export("json")}>
          Export current data
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const s = useEngine();
  const [page, setPage] = useState("Live Tracking"),
    [sidebar, setSidebar] = useState(false);
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: light)");
    const apply = () =>
      (document.documentElement.dataset.theme =
        s.settings.theme === "system"
          ? query.matches
            ? "light"
            : "dark"
          : s.settings.theme);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [s.settings.theme]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat ||
        (e.target as HTMLElement).matches(
          "input,select,textarea,[contenteditable]",
        )
      )
        return;
      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          engine.pause();
          break;
        case "l":
          engine.lock();
          break;
        case "u":
          engine.state.locked = null;
          engine.notify(true);
          break;
        case "r":
          engine.reset();
          break;
        case "c":
          engine.snapshot();
          break;
        case "e":
          engine.export("csv");
          break;
        case "f":
          if (document.fullscreenElement) void document.exitFullscreen();
          else
            void document.documentElement
              .requestFullscreen()
              .catch((e) => engine.fail(e));
          break;
        case "t":
          engine.toggleTracking();
          break;
        case "g":
          engine.setSettings({ graphs: !engine.state.settings.graphs });
          break;
        case "m":
          engine.setSettings({ landmarks: !engine.state.settings.landmarks });
          break;
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <ErrorBoundary>
      <div className="app-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            onClick={() => setSidebar(!sidebar)}
          >
            <Menu />
          </button>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPage("Live Tracking");
            }}
          >
            <Logo />
            <span>
              <strong>MathTech</strong>
              <small>I HAVE NO LIMITATION</small>
            </span>
          </a>
          <div className="product-title">
            <h1>Face Tracking & Analysis System</h1>
            <p>
              Real-time Face Detection <i /> Tracking <i /> Movement Analysis{" "}
              <i /> Advanced Imaging
            </p>
          </div>
          <div className="header-status">
            <span className="status-dot" />
            <span>System Online</span>
          </div>
          <time className="header-time">
            {clock.toLocaleDateString("en-CA")}{" "}
            {clock.toLocaleTimeString("en-GB")}
          </time>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => setPage("Model Settings")}
          >
            <Settings size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Fullscreen application"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else
                void document.documentElement
                  .requestFullscreen()
                  .catch((e) => engine.fail(e));
            }}
          >
            <Maximize size={18} />
          </button>
        </header>
        <aside className={sidebar ? "sidebar open" : "sidebar"}>
          <nav aria-label="Main navigation">
            {NAV.map(([name, Icon]) => (
              <button
                key={name}
                className={page === name ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setPage(name);
                  setSidebar(false);
                }}
                aria-current={page === name ? "page" : undefined}
              >
                <Icon size={19} />
                <span>{name}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="local-badge">
              <ShieldCheck size={16} />
              <span>
                Private by design<small>Processed on your device</small>
              </span>
            </div>
            <div className="sidebar-brand">
              <Logo />
              <span>
                MathTech<small>Face Tracking Pro v1.0.0</small>
              </span>
            </div>
            <p>
              Built with <span>♥</span> by MathTech
            </p>
          </div>
        </aside>
        <main className="main-area">
          {s.error && (
            <div className="error-banner" role="alert">
              <strong>{s.error}</strong>
              <button
                aria-label="Dismiss error"
                onClick={() => {
                  s.error = "";
                  engine.notify(true);
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <Suspense
            fallback={
              <div className="page-loading">
                <span className="spinner" /> Loading workspace…
              </div>
            }
          >
            {page === "Live Tracking" ? (
              <div className="dashboard">
                <div className="dashboard-top">
                  <Camera />
                  <FaceInfo />
                  <Controls />
                </div>
                <div className="dashboard-bottom">
                  <div className="bottom-left">
                    <div className="graphs-head">
                      {s.settings.graphs && <MovementCharts />}
                      <HeadView />
                    </div>
                    <Landmarks />
                  </div>
                  <div className="bottom-right">
                    <Imaging />
                    <EventLog />
                  </div>
                </div>
                <div className="system-footer">
                  <span>
                    <ShieldCheck size={12} />{" "}
                    {s.settings.backend
                      ? "BACKEND PROCESSING ENABLED"
                      : "BROWSER-LOCAL PROCESSING"}
                  </span>
                  <span>
                    <Activity size={12} /> Detection {s.detectionMs.toFixed(1)}{" "}
                    ms · Tracking {s.trackingMs.toFixed(2)} ms
                  </span>
                  <span>
                    {s.session.samples.length.toLocaleString()} samples ·{" "}
                    {s.status}
                  </span>
                </div>
              </div>
            ) : page === "Analytics" ? (
              <Analytics />
            ) : page === "Image Processing" ? (
              <div className="page">
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">RGB PROCESSING WORKSPACE</p>
                    <h1>Image Processing</h1>
                    <p>
                      Explore ten visualizations of your active camera or media
                      source.
                    </p>
                  </div>
                </div>
                <Imaging full />
              </div>
            ) : page === "Model Settings" ? (
              <ModelSettings />
            ) : page === "Export" ? (
              <Export />
            ) : (
              <Help />
            )}
          </Suspense>
        </main>
      </div>
    </ErrorBoundary>
  );
}
