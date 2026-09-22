import type { Detection, Point } from "../types";
import { GROUPS } from "./math";
/** Deterministic synthetic data. Never passed off as an actual detector result. */
export function demoFrame(
  canvas: HTMLCanvasElement,
  t: number,
  maxFaces: number,
): Detection[] {
  const ctx = canvas.getContext("2d")!;
  canvas.width = 960;
  canvas.height = 600;
  const bg = ctx.createLinearGradient(0, 0, 960, 600);
  bg.addColorStop(0, "#132638");
  bg.addColorStop(1, "#06101a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 960, 600);
  ctx.strokeStyle = "#1a3448";
  ctx.lineWidth = 1;
  for (let x = 0; x < 960; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(960, y);
    ctx.stroke();
  }
  ctx.fillStyle = "#355a70";
  ctx.font = "12px monospace";
  ctx.fillText("MATHTECH  /  COMPUTER VISION LABORATORY", 28, 560);
  ctx.fillText("SYNTHETIC SUBJECT · NO CAMERA IN USE", 28, 581);
  return Array.from({ length: Math.min(maxFaces, 2) }, (_, k) => {
    const cx = (k === 0 ? 445 : 755) + Math.sin(t * 0.48 + k * 3) * 62,
      cy = (k === 0 ? 285 : 310) + Math.sin(t * 0.67 + k) * 30;
    const width = (k === 0 ? 220 : 125) * (1 + 0.08 * Math.sin(t * 0.4)),
      height = width * 1.35;
    const points: Point[] = Array.from({ length: 478 }, (_, i) => {
      const a = i * 2.39996,
        r = Math.sqrt((i % 91) / 91);
      return {
        x: cx + Math.cos(a) * width * 0.44 * r,
        y: cy + Math.sin(a) * height * 0.48 * r,
        z: -40 * (1 - r * r),
      };
    });
    GROUPS.Jawline.forEach((idx, i) => {
      const a = -Math.PI / 2 + (i / GROUPS.Jawline.length) * Math.PI * 2;
      points[idx] = {
        x: cx + (Math.cos(a) * width) / 2,
        y: cy + (Math.sin(a) * height) / 2,
        z: 0,
      };
    });
    const assign = (
      ids: number[],
      x: number,
      y: number,
      rx: number,
      ry: number,
    ) =>
      ids.forEach((idx, i) => {
        const a = (i / ids.length) * Math.PI * 2;
        points[idx] = {
          x: x + Math.cos(a) * rx,
          y: y + Math.sin(a) * ry,
          z: -25,
        };
      });
    assign(
      GROUPS["Left Eye"],
      cx + width * 0.2,
      cy - height * 0.1,
      width * 0.085,
      height * 0.028,
    );
    assign(
      GROUPS["Right Eye"],
      cx - width * 0.2,
      cy - height * 0.1,
      width * 0.085,
      height * 0.028,
    );
    assign(
      GROUPS["Left Brow"],
      cx + width * 0.2,
      cy - height * 0.21,
      width * 0.11,
      height * 0.015,
    );
    assign(
      GROUPS["Right Brow"],
      cx - width * 0.2,
      cy - height * 0.21,
      width * 0.11,
      height * 0.015,
    );
    assign(GROUPS.Mouth, cx, cy + height * 0.21, width * 0.17, height * 0.04);
    points[1] = { x: cx + Math.sin(t) * 5, y: cy + height * 0.05, z: -65 };
    points[13] = { x: cx, y: cy + height * 0.19, z: -35 };
    points[14] = { x: cx, y: cy + height * 0.24, z: -35 };
    points[152] = { x: cx, y: cy + height * 0.5, z: 0 };
    points[159] = { x: cx - width * 0.2, y: cy - height * 0.12, z: -25 };
    points[145] = { x: cx - width * 0.2, y: cy - height * 0.08, z: -25 };
    const skin = ctx.createRadialGradient(
      cx - 40,
      cy - 50,
      10,
      cx,
      cy,
      height * 0.55,
    );
    skin.addColorStop(0, "#5893a5");
    skin.addColorStop(0.5, "#285266");
    skin.addColorStop(1, "#0d2737");
    ctx.fillStyle = "#142d40";
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy + height * 0.9,
      width * 0.85,
      height * 0.55,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(cx, cy, width * 0.5, height * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#65bed1";
    ctx.lineWidth = 1.3;
    for (const group of [
      "Left Eye",
      "Right Eye",
      "Left Brow",
      "Right Brow",
      "Mouth",
    ]) {
      ctx.beginPath();
      GROUPS[group].forEach((idx, i) => {
        const p = points[idx];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx, cy - height * 0.08);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.lineTo(cx + width * 0.045, cy + height * 0.08);
    ctx.stroke();
    return {
      bbox: { x: cx - width / 2, y: cy - height / 2, width, height },
      landmarks: points,
      confidence: null,
      pose: {
        yaw: Math.sin(t * 0.6) * 18,
        pitch: Math.sin(t * 0.4) * 8,
        roll: Math.sin(t * 0.7) * 5,
      },
      signals: {
        eyeBlinkLeft: (Math.sin(t * 2) + 1) * 0.04,
        eyeBlinkRight: (Math.sin(t * 2) + 1) * 0.04,
      },
    };
  });
}
