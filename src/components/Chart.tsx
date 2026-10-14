"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Reading } from "@/gen/calado/v1/calado_pb";
import { fmtDateTime, fmtDay } from "@/lib/format";
import { THRESHOLDS } from "@/lib/status";

const W = 760;
const H = 260;
const P = 8;
const TICK_H = 22;

/** Máximo de etiquetas en el eje X (evita solapamiento en ~30 días). */
function tickIndices(length: number, maxLabels = 7): number[] {
  if (length <= 1) return [0];
  if (length <= maxLabels) return Array.from({ length }, (_, i) => i);
  const step = Math.ceil((length - 1) / (maxLabels - 1));
  const out: number[] = [];
  for (let i = 0; i < length; i += step) out.push(i);
  if (out[out.length - 1] !== length - 1) out.push(length - 1);
  return out;
}

function yMax(cm: number[]) {
  const peak = cm.length ? Math.max(...cm) : 0;
  return Math.max(THRESHOLDS.critical + 12, peak > 0 ? Math.ceil(peak * 1.25) : 80, 60);
}

export default function Chart({
  data,
  placeholder,
  spanDays = 30,
}: {
  data: Reading[];
  placeholder: string;
  spanDays?: number;
}) {
  const [sel, setSel] = useState<number | null>(null);

  if (data.length < 2) return <div className="chart empty skeleton">{placeholder}</div>;

  const max = yMax(data.map((d) => d.cm));
  const ticks = tickIndices(data.length, spanDays >= 28 ? 7 : 8);
  const x = (i: number) => P + (i / (data.length - 1)) * (W - 2 * P);
  const y = (cm: number) => H - P - (cm / max) * (H - 2 * P);
  const line = data.map((d, i) => `${x(i)},${y(d.cm)}`).join(" ");
  const area = `M${x(0)},${H} L${line.replaceAll(" ", " L")} L${x(data.length - 1)},${H} Z`;
  const cur = sel === null ? null : data[sel];

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setSel(Math.round(f * (data.length - 1)));
  };

  const key = (e: KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 24 : 1;
    if (e.key === "ArrowLeft") setSel(Math.max((sel ?? data.length - 1) - step, 0));
    if (e.key === "ArrowRight") setSel(Math.min((sel ?? 0) + step, data.length - 1));
  };

  return (
    <>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H + TICK_H}`}
        tabIndex={0}
        role="img"
        aria-label="Nivel del Rin en Kaub. Usa las flechas para leer cada hora."
        onPointerMove={move}
        onPointerDown={move}
        onPointerLeave={() => setSel(null)}
        onKeyDown={key}
      >
        <path d={area} className="area" />
        <line x1="0" x2={W} y1={y(THRESHOLDS.critical)} y2={y(THRESHOLDS.critical)} className="thr" />
        <text x={W - 4} y={y(THRESHOLDS.critical) - 6} textAnchor="end" className="thr-label">
          78 cm · crítico
        </text>
        <polyline points={line} className="line" />
        {ticks.map((i, ti) => {
          const anchor = ti === 0 ? "start" : ti === ticks.length - 1 ? "end" : "middle";
          return (
            <text key={i} x={x(i)} y={H + 15} textAnchor={anchor} className="tick">
              {fmtDay(data[i].ts)}
            </text>
          );
        })}
        {cur && sel !== null && (
          <g>
            <line x1={x(sel)} x2={x(sel)} y1="0" y2={H} className="cursor" />
            <circle cx={x(sel)} cy={y(cur.cm)} r="5" className="dot" />
          </g>
        )}
      </svg>
      <p className="hover" aria-live="polite">
        {cur ? (
          <>
            <b className="num">{cur.cm} cm</b> · {fmtDateTime(cur.ts)} (hora de Berlín)
          </>
        ) : (
          "Pasa el dedo o el mouse por la gráfica para leer cada hora."
        )}
      </p>
    </>
  );
}
