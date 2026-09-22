import { useEffect, useRef, useState } from "react";
import { engine } from "../services/engine";
import { imageDefaults, MODES, modeNote, processImage } from "../core/imaging";
import type { ImageOptions, ImagingMode } from "../core/imaging";
import { Panel, Range } from "./Common";
export function ImageCanvas({
  mode,
  options = imageDefaults,
  className = "",
}: {
  mode: ImagingMode;
  options?: ImageOptions;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const tick = () => {
      const c = ref.current;
      if (!c) return;
      c.width = 400;
      c.height = Math.round((400 * engine.raw.height) / engine.raw.width);
      processImage(c, engine.raw, engine.state.tracks, mode, options);
    };
    tick();
    const timer = setInterval(tick, 220);
    return () => clearInterval(timer);
  }, [mode, options]);
  return (
    <canvas
      className={className}
      ref={ref}
      aria-label={`${mode} processed image`}
      role="img"
    />
  );
}
export function Imaging({ full = false }: { full?: boolean }) {
  const [mode, setMode] = useState<ImagingMode>("Original");
  const [options, setOptions] = useState(imageDefaults);
  return (
    <Panel
      title={full ? "Image Processing Laboratory" : "Image Analysis"}
      className="imaging-panel"
      action={<span className="micro">LOCAL RGB</span>}
    >
      <div
        className="image-tabs"
        role="tablist"
        aria-label="Image processing modes"
      >
        {(full
          ? MODES
          : ([
              "Original",
              "Depth",
              "Thermal",
              "Blur",
              "Night Vision",
              "Segmentation",
            ] as ImagingMode[])
        ).map((m) => (
          <button
            role="tab"
            aria-selected={m === mode}
            className={m === mode ? "active" : ""}
            key={m}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
      <div className={full ? "image-full" : "image-grid"}>
        <div className="main-image">
          <ImageCanvas mode={mode} options={options} />
          <span>{mode}</span>
        </div>
        {!full && (
          <div className="image-thumbs">
            {(
              [
                "Thermal",
                "Grayscale",
                "Night Vision",
                "Segmentation",
              ] as ImagingMode[]
            ).map((m) => (
              <button
                key={m}
                aria-label={`View ${m}`}
                onClick={() => setMode(m)}
              >
                <ImageCanvas mode={m} />
                <span>{m}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="image-note">
        {modeNote(mode) ||
          "Processed from the current source · no frame uploads by default"}
      </p>
      {full && (
        <div className="image-controls">
          <label>
            Blur mode
            <select
              value={options.blur}
              onChange={(e) =>
                setOptions({
                  ...options,
                  blur: e.target.value as ImageOptions["blur"],
                })
              }
            >
              {["Gaussian", "Motion", "Face", "Background"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <Range
            label="Blur radius"
            value={options.radius}
            min={0}
            max={20}
            step={1}
            onChange={(radius) => setOptions({ ...options, radius })}
          />
          <label>
            Mask mode
            <select
              value={options.mask}
              onChange={(e) =>
                setOptions({
                  ...options,
                  mask: e.target.value as ImageOptions["mask"],
                })
              }
            >
              {["Overlay", "Face only", "Face mask", "Background mask"].map(
                (m) => (
                  <option key={m}>{m}</option>
                ),
              )}
            </select>
          </label>
          <Range
            label="Mask opacity"
            value={options.opacity}
            onChange={(opacity) => setOptions({ ...options, opacity })}
          />
          <Range
            label="Background visibility"
            value={options.background}
            onChange={(background) => setOptions({ ...options, background })}
          />
          <Range
            label="Edge strength"
            min={0.5}
            max={5}
            step={0.25}
            value={options.edge}
            onChange={(edge) => setOptions({ ...options, edge })}
          />
          <button
            onClick={() => {
              const c = document.createElement("canvas");
              c.width = engine.raw.width;
              c.height = engine.raw.height;
              processImage(c, engine.raw, engine.state.tracks, mode, options);
              c.toBlob((b) => {
                if (b) {
                  const a = document.createElement("a");
                  const url = URL.createObjectURL(b);
                  a.href = url;
                  a.download = `mathtech-${mode.replaceAll(" ", "-")}.png`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
              });
            }}
          >
            Export processed PNG
          </button>
        </div>
      )}
    </Panel>
  );
}
