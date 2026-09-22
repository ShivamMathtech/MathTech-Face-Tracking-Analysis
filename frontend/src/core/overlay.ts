import type { Settings, Track } from "../types";
import { convert, GROUPS } from "./math";
const colors = ["#04fca0", "#30b9ff", "#c078ff", "#ffcb59", "#ff7faa"];
export function overlay(
  c: CanvasRenderingContext2D,
  tracks: Track[],
  settings: Settings,
  w: number,
  h: number,
  target: string | null,
) {
  c.save();
  const scale = Math.max(1, w / 960);
  c.lineWidth = 1.5 * scale;
  c.font = `${12 * scale}px ui-monospace, monospace`;
  if (settings.axes) {
    c.strokeStyle = "#30749f70";
    c.beginPath();
    c.moveTo(w / 2, 0);
    c.lineTo(w / 2, h);
    c.moveTo(0, h / 2);
    c.lineTo(w, h / 2);
    c.stroke();
    c.fillStyle = "#a0cbdf";
    c.fillText(
      settings.coordinates === "math"
        ? "X →   Y ↑   origin: bottom-left"
        : "(0,0)   X →   Y ↓",
      14 * scale,
      25 * scale,
    );
  }
  for (const [index, t] of tracks.entries()) {
    if (t.status === "lost") continue;
    const color = t.id === target ? "#00ff91" : colors[index % colors.length];
    const b = t.bbox;
    c.strokeStyle = color;
    c.fillStyle = color;
    if (settings.heatmap) {
      const now = t.history.at(-1)?.timestamp ?? 0;
      for (const p of t.history.filter((_, i) => i % 5 === 0)) {
        const age = (now - p.timestamp) / 1000;
        c.globalAlpha =
          Math.exp(-age / settings.heatDecay) * settings.heatIntensity * 0.035;
        const g = c.createRadialGradient(
          p.center_x,
          p.center_y,
          0,
          p.center_x,
          p.center_y,
          30 * scale,
        );
        g.addColorStop(0, "#ff6949");
        g.addColorStop(1, "transparent");
        c.fillStyle = g;
        c.fillRect(
          p.center_x - 30 * scale,
          p.center_y - 30 * scale,
          60 * scale,
          60 * scale,
        );
      }
      c.globalAlpha = 1;
      c.fillStyle = color;
    }
    if (settings.bbox) {
      c.strokeRect(b.x, b.y, b.width, b.height);
      c.lineWidth = 3 * scale;
      const n = Math.min(b.width / 5, 18 * scale);
      for (const [x, y, sx, sy] of [
        [b.x, b.y, 1, 1],
        [b.x + b.width, b.y, -1, 1],
        [b.x, b.y + b.height, 1, -1],
        [b.x + b.width, b.y + b.height, -1, -1],
      ]) {
        c.beginPath();
        c.moveTo(x + n * sx, y);
        c.lineTo(x, y);
        c.lineTo(x, y + n * sy);
        c.stroke();
      }
      c.lineWidth = 1.5 * scale;
    }
    if (settings.landmarks) {
      for (const group of settings.groups) {
        for (const i of GROUPS[group] ?? []) {
          const p = t.landmarks[i];
          if (!p) continue;
          c.beginPath();
          c.arc(p.x, p.y, 1.65 * scale, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    if (settings.movement && settings.trail > 0) {
      c.beginPath();
      t.history
        .slice(-settings.trail)
        .forEach((p, i) =>
          i
            ? c.lineTo(p.center_x, p.center_y)
            : c.moveTo(p.center_x, p.center_y),
        );
      c.stroke();
    }
    if (settings.crosshair) {
      c.globalAlpha = 0.6;
      c.beginPath();
      c.moveTo(t.center.x, 0);
      c.lineTo(t.center.x, h);
      c.moveTo(0, t.center.y);
      c.lineTo(w, t.center.y);
      c.stroke();
      c.globalAlpha = 1;
    }
    if (settings.center) {
      c.beginPath();
      c.arc(t.center.x, t.center.y, 4 * scale, 0, Math.PI * 2);
      c.fill();
    }
    if (settings.vector) {
      c.strokeStyle = "#ffd263";
      c.beginPath();
      c.moveTo(t.center.x, t.center.y);
      c.lineTo(
        t.center.x + t.velocity.x * 0.2,
        t.center.y + t.velocity.y * 0.2,
      );
      c.stroke();
    }
    if (settings.pose) {
      const x = t.center.x,
        y = t.center.y,
        len = b.width * 0.3;
      const yaw = (t.pose.yaw * Math.PI) / 180,
        roll = (t.pose.roll * Math.PI) / 180;
      c.strokeStyle = "#ff535f";
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len * Math.cos(roll), y + len * Math.sin(roll));
      c.stroke();
      c.strokeStyle = "#20ffad";
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len * Math.sin(roll), y - len * Math.cos(roll));
      c.stroke();
      c.strokeStyle = "#218fff";
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + len * Math.sin(yaw), y + len * 0.5);
      c.stroke();
    }
    if (settings.labels) {
      const p = convert(t.center, h, settings.coordinates);
      const text = `${t.id}  ${Math.round(p.x)}, ${Math.round(p.y)}  ${t.confidence === null ? "score n/a" : (t.confidence * 100).toFixed(1) + "%"}`;
      const x = Math.max(
          0,
          Math.min(b.x, w - c.measureText(text).width - 14 * scale),
        ),
        y = Math.max(25 * scale, b.y - 8 * scale);
      c.fillStyle = "#02131de8";
      c.fillRect(
        x,
        y - 18 * scale,
        c.measureText(text).width + 12 * scale,
        24 * scale,
      );
      c.fillStyle = color;
      c.fillText(text, x + 6 * scale, y);
    }
  }
  c.restore();
}
