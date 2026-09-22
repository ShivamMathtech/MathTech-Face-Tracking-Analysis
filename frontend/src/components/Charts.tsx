import { useEffect, useRef } from "react";
import { engine, useEngine } from "../services/engine";
import type { Sample } from "../types";
import { Panel, fmt } from "./Common";
export function Spark({
  field,
  color = "#20a8ff",
  label,
  raw = false,
}: {
  field: keyof Sample;
  color?: string;
  label: string;
  raw?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      const c = ref.current;
      if (!c || engine.state.graphPaused) return;
      const s = engine.state;
      const target = engine.selected();
      const id = s.locked ?? s.target;
      let records =
        s.source === "session"
          ? s.session.samples.filter((r) =>
              id === "auto"
                ? r.face_id === s.session.samples.at(-1)?.face_id
                : r.face_id === id,
            )
          : (target?.history ?? []);
      const end = records.at(-1)?.timestamp ?? Date.now();
      records = records.filter(
        (p) => p.timestamp >= end - s.graphWindow * 1000,
      );
      const width = c.clientWidth || 300,
        height = 64,
        dpr = devicePixelRatio || 1;
      c.width = width * dpr;
      c.height = height * dpr;
      const ctx = c.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "#153149";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo((i * width) / 6, 0);
        ctx.lineTo((i * width) / 6, height);
        ctx.stroke();
      }
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.moveTo(0, (j * height) / 2);
        ctx.lineTo(width, (j * height) / 2);
        ctx.stroke();
      }
      const vals = records.map((r) => Number(r[field] ?? 0));
      const max = Math.max(0.01, ...vals.map(Math.abs));
      const y = (v: number) => height / 2 - (v / max) * (height / 2 - 5);
      const x = (r: Sample) =>
        ((r.timestamp - (end - s.graphWindow * 1000)) /
          (s.graphWindow * 1000)) *
        width;
      if (records.length) {
        ctx.beginPath();
        records.forEach((r, i) =>
          i
            ? ctx.lineTo(x(r), y(Number(r[field])))
            : ctx.moveTo(x(r), y(Number(r[field]))),
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.lineTo(x(records.at(-1)!), height);
        ctx.lineTo(x(records[0]), height);
        ctx.closePath();
        ctx.fillStyle = color + "12";
        ctx.fill();
        if (raw && (field === "center_x" || field === "center_y")) {
          ctx.beginPath();
          records.forEach((r, i) =>
            i
              ? ctx.lineTo(x(r), y(field === "center_x" ? r.raw_x : r.raw_y))
              : ctx.moveTo(x(r), y(field === "center_x" ? r.raw_x : r.raw_y)),
          );
          ctx.strokeStyle = "#ffb355";
          ctx.setLineDash([3, 3]);
          ctx.stroke();
        }
        if (valueRef.current)
          valueRef.current.textContent = fmt(
            vals.at(-1),
            field === "delta_z" ? 3 : 1,
          );
      } else if (valueRef.current) valueRef.current.textContent = "—";
      ctx.fillStyle = "#6987a6";
      ctx.font = "9px system-ui";
      ctx.fillText(`±${max.toFixed(max < 1 ? 3 : 0)}`, 4, 10);
    }, 180);
    return () => clearInterval(timer);
  }, [field, color, raw]);
  return (
    <div className="spark">
      <div>
        <span>{label}</span>
        <span ref={valueRef} style={{ color }}>
          —
        </span>
      </div>
      <canvas ref={ref} aria-label={`${label} over time`} role="img" />
    </div>
  );
}
export function MovementCharts() {
  const s = useEngine();
  return (
    <Panel
      title="Face Movement Graphs"
      action={
        <div className="segments">
          {[1, 5, 10, 30, 60].map((n) => (
            <button
              key={n}
              className={n === s.graphWindow ? "active" : ""}
              onClick={() => {
                s.graphWindow = n;
                engine.notify(true);
              }}
            >
              {n}s
            </button>
          ))}
        </div>
      }
    >
      <div className="chart-body">
        <Spark field="delta_x" label="Horizontal (X) · px" />
        <Spark field="delta_y" label="Vertical (Y) · px" color="#14efa6" />
        <Spark
          field="delta_z"
          label="Relative depth ΔZ · ratio"
          color="#b061ff"
        />
        <div className="chart-footer">
          <span>Time → · target-specific</span>
          <button
            onClick={() => {
              s.graphPaused = !s.graphPaused;
              engine.notify(true);
            }}
          >
            {s.graphPaused ? "Resume graphs" : "Pause graphs"}
          </button>
        </div>
      </div>
    </Panel>
  );
}
