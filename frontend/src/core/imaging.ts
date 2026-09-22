import type { Track } from "../types";
import { GROUPS, clamp } from "./math";
export const MODES = [
  "Original",
  "Depth",
  "Thermal",
  "Blur",
  "Night Vision",
  "Grayscale",
  "Edges",
  "Segmentation",
  "Contrast",
  "Sharpen",
] as const;
export type ImagingMode = (typeof MODES)[number];
export interface ImageOptions {
  radius: number;
  blur: "Gaussian" | "Motion" | "Face" | "Background";
  opacity: number;
  background: number;
  edge: number;
  mask: "Overlay" | "Face only" | "Face mask" | "Background mask";
}
export const imageDefaults: ImageOptions = {
  radius: 5,
  blur: "Gaussian",
  opacity: 0.55,
  background: 0.3,
  edge: 1,
  mask: "Overlay",
};
export const modeNote = (m: ImagingMode) =>
  m === "Thermal"
    ? "THERMAL STYLE · RGB intensity, no temperature"
    : m === "Depth"
      ? "DEPTH ESTIMATE · face geometry, not metric"
      : m === "Night Vision"
        ? "NIGHT VISION STYLE · enhanced RGB"
        : m === "Segmentation"
          ? "LANDMARK FACE MASK · geometric segmentation"
          : "";
function mask(
  ctx: CanvasRenderingContext2D,
  tracks: Track[],
  sx: number,
  sy: number,
) {
  ctx.beginPath();
  for (const t of tracks) {
    if (t.status === "lost") continue;
    GROUPS.Jawline.forEach((idx, i) => {
      const p = t.landmarks[idx];
      if (!p) return;
      if (i === 0) ctx.moveTo(p.x * sx, p.y * sy);
      else ctx.lineTo(p.x * sx, p.y * sy);
    });
    ctx.closePath();
  }
}
export function processImage(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  tracks: Track[],
  mode: ImagingMode,
  options: ImageOptions = imageDefaults,
) {
  const w = canvas.width,
    h = canvas.height,
    ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const sx = w / source.width,
    sy = h / source.height;
  ctx.clearRect(0, 0, w, h);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (mode === "Blur") {
    if (options.blur === "Motion") {
      ctx.drawImage(source, 0, 0, w, h);
      ctx.globalAlpha = 0.15;
      for (let i = -4; i <= 4; i++)
        ctx.drawImage(source, (i * options.radius) / 2, 0, w, h);
      ctx.globalAlpha = 1;
      return;
    }
    if (options.blur === "Background") {
      ctx.filter = `blur(${options.radius}px)`;
      ctx.drawImage(source, 0, 0, w, h);
      ctx.filter = "none";
      ctx.save();
      mask(ctx, tracks, sx, sy);
      ctx.clip();
      ctx.drawImage(source, 0, 0, w, h);
      ctx.restore();
      return;
    }
    ctx.drawImage(source, 0, 0, w, h);
    ctx.save();
    if (options.blur === "Face") {
      mask(ctx, tracks, sx, sy);
      ctx.clip();
    }
    ctx.filter = `blur(${options.radius}px)`;
    ctx.drawImage(source, 0, 0, w, h);
    ctx.restore();
    ctx.filter = "none";
    return;
  }
  if (mode === "Segmentation") {
    if (options.mask === "Face mask" || options.mask === "Background mask") {
      ctx.fillStyle = options.mask === "Face mask" ? "black" : "white";
      ctx.fillRect(0, 0, w, h);
      mask(ctx, tracks, sx, sy);
      ctx.fillStyle = options.mask === "Face mask" ? "white" : "black";
      ctx.fill();
      return;
    }
    if (options.mask === "Overlay") {
      ctx.globalAlpha = options.background;
      ctx.drawImage(source, 0, 0, w, h);
      ctx.globalAlpha = 1;
    }
    ctx.save();
    mask(ctx, tracks, sx, sy);
    ctx.clip();
    ctx.drawImage(source, 0, 0, w, h);
    if (options.mask === "Overlay") {
      ctx.globalAlpha = options.opacity;
      ctx.fillStyle = "#13f0ac";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    return;
  }
  if (mode === "Depth") {
    ctx.fillStyle = "#010918";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    mask(ctx, tracks, sx, sy);
    ctx.clip();
    for (const t of tracks.filter((t) => t.status === "tracking")) {
      const p = t.landmarks[1] ?? t.center;
      const g = ctx.createRadialGradient(
        p.x * sx,
        p.y * sy,
        0,
        t.center.x * sx,
        t.center.y * sy,
        t.bbox.height * sy * 0.6,
      );
      g.addColorStop(0, "#ff535e");
      g.addColorStop(0.25, "#ffce44");
      g.addColorStop(0.48, "#42f287");
      g.addColorStop(0.7, "#2286ff");
      g.addColorStop(1, "#3525aa");
      ctx.fillStyle = g;
      ctx.fillRect(
        t.bbox.x * sx,
        t.bbox.y * sy,
        t.bbox.width * sx,
        t.bbox.height * sy,
      );
    }
    ctx.restore();
    return;
  }
  if (mode === "Night Vision")
    ctx.filter = "blur(.5px) brightness(1.5) contrast(1.2)";
  ctx.drawImage(source, 0, 0, w, h);
  ctx.filter = "none";
  if (mode === "Original") return;
  const pixels = ctx.getImageData(0, 0, w, h);
  const d = pixels.data;
  const input = new Uint8ClampedArray(d);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4,
        gray =
          0.2126 * input[i] + 0.7152 * input[i + 1] + 0.0722 * input[i + 2];
      if (mode === "Thermal") {
        const f = gray / 255;
        d[i] = 255 * clamp(1.5 - Math.abs(4 * f - 3), 0, 1);
        d[i + 1] = 255 * clamp(1.5 - Math.abs(4 * f - 2), 0, 1);
        d[i + 2] = 255 * clamp(1.5 - Math.abs(4 * f - 1), 0, 1);
      } else if (mode === "Night Vision") {
        d[i] = gray * 0.12;
        d[i + 1] = gray;
        d[i + 2] = gray * 0.32;
      } else if (mode === "Grayscale") {
        d[i] = d[i + 1] = d[i + 2] = gray;
      } else if (mode === "Contrast") {
        for (let k = 0; k < 3; k++)
          d[i + k] = clamp((input[i + k] - 128) * 1.65 + 128, 0, 255);
      } else if (mode === "Edges" || mode === "Sharpen") {
        const at = (xx: number, yy: number, k: number) =>
          input[(clamp(yy, 0, h - 1) * w + clamp(xx, 0, w - 1)) * 4 + k];
        if (mode === "Edges") {
          const gx = at(x + 1, y, 1) - at(x - 1, y, 1),
            gy = at(x, y + 1, 1) - at(x, y - 1, 1);
          d[i] = d[i + 1] = d[i + 2] = Math.hypot(gx, gy) * options.edge;
        } else
          for (let k = 0; k < 3; k++)
            d[i + k] =
              5 * at(x, y, k) -
              at(x - 1, y, k) -
              at(x + 1, y, k) -
              at(x, y - 1, k) -
              at(x, y + 1, k);
      }
    }
  ctx.putImageData(pixels, 0, 0);
}
