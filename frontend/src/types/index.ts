export interface Point {
  x: number;
  y: number;
  z: number;
}
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Pose {
  yaw: number;
  pitch: number;
  roll: number;
}
export interface Detection {
  bbox: Box;
  landmarks: Point[];
  confidence: number | null;
  pose: Pose;
  signals: Record<string, number>;
}
export interface Sample {
  timestamp: number;
  face_id: string;
  source: string;
  confidence: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
  center_x: number;
  center_y: number;
  raw_x: number;
  raw_y: number;
  delta_x: number;
  delta_y: number;
  delta_z: number;
  depth: number;
  distance: number;
  velocity: number;
  vx: number;
  vy: number;
  acceleration: number;
  direction: number;
  yaw: number;
  pitch: number;
  roll: number;
  nose_x: number;
  nose_y: number;
  left_eye_x: number;
  left_eye_y: number;
  right_eye_x: number;
  right_eye_y: number;
  mouth_x: number;
  mouth_y: number;
  chin_x: number;
  chin_y: number;
  eye_ratio: number;
  mouth_ratio: number;
  blink_left: number;
  blink_right: number;
}
export interface Track extends Detection {
  id: string;
  center: Point;
  raw: Point;
  lastSeen: number;
  status: "tracking" | "lost";
  velocity: Point;
  baselineWidth: number;
  sample: Sample;
  history: Sample[];
}
export type SourceKind =
  | "none"
  | "demo"
  | "camera"
  | "image"
  | "video"
  | "session";
export interface Settings {
  threshold: number;
  maxFaces: number;
  minSize: number;
  smoothing: number;
  lostTimeout: number;
  sensitivity: number;
  reacquire: boolean;
  trail: number;
  fps: number;
  frameSkip: number;
  resolution: string;
  coordinates: "image" | "math";
  bbox: boolean;
  landmarks: boolean;
  center: boolean;
  crosshair: boolean;
  labels: boolean;
  axes: boolean;
  movement: boolean;
  pose: boolean;
  vector: boolean;
  graphs: boolean;
  heatmap: boolean;
  heatIntensity: number;
  heatDecay: number;
  theme: "dark" | "light" | "system";
  autoSave: boolean;
  groups: string[];
  backend: boolean;
}
export interface Session {
  version: 1;
  id: string;
  start_time: string;
  end_time: string | null;
  source: SourceKind;
  camera: string;
  resolution: string;
  model: string;
  settings: Settings;
  samples: Sample[];
  events: LogEntry[];
  dropped_samples: number;
}
export interface LogEntry {
  time: string;
  level: "info" | "warning" | "error";
  message: string;
}
export interface State {
  source: SourceKind;
  sourceName: string;
  status: string;
  modelStatus: "idle" | "loading" | "ready" | "error";
  error: string;
  paused: boolean;
  tracking: boolean;
  permission: string;
  width: number;
  height: number;
  fps: number;
  detectionMs: number;
  trackingMs: number;
  tracks: Track[];
  target: string;
  locked: string | null;
  settings: Settings;
  session: Session;
  recordingData: boolean;
  recordingVideo: boolean;
  logs: LogEntry[];
  logPaused: boolean;
  graphPaused: boolean;
  graphWindow: number;
  devices: MediaDeviceInfo[];
  cameraId: string;
  mediaTime: number;
  duration: number;
  speed: number;
  revision: number;
}
