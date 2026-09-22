import type { PropsWithChildren, ReactNode } from "react";
export function Panel({
  title,
  action,
  children,
  className = "",
}: PropsWithChildren<{
  title: string;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        className="switch"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
export function Range({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.05,
  onChange,
  unit = "",
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
  unit?: string;
}) {
  return (
    <label className="range-field">
      <span>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export const fmt = (n: number | undefined, d = 1) =>
  n === undefined ? "—" : Number.isFinite(n) ? n.toFixed(d) : "—";
export const signed = (n: number | undefined, d = 1) =>
  n === undefined ? "—" : `${n >= 0 ? "+" : ""}${fmt(n, d)}`;
export function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={accent ? "accent" : ""}>{value}</strong>
    </div>
  );
}
