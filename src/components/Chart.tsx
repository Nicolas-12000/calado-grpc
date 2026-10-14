"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Reading } from "@/gen/calado/v1/calado_pb";
import { fmtDateTime, fmtDay } from "@/lib/format";
import { THRESHOLDS } from "@/lib/status";

const W = 760;
const H = 260;
const P = 8;

export default function Chart({ data, placeholder }: { data: Reading[]; placeholder: string }) {
  const [sel, setSel] = useState<number | null>(null);

  if (data.length < 2) return <div className="chart empty skeleton">{placeholder}</div>;

  const max = Math.max(200, ...data.map((d) => d.cm));
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
        viewBox={`0 0 ${W} ${H + 18}`}
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
        {data.map(
          (d, i) =>
            i % 24 === 0 && (
              <text key={i} x={x(i)} y={H + 14} className="tick">
                {fmtDay(d.ts)}
              </text>
            ),
        )}
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
