import { THRESHOLDS } from "@/lib/status";

const H = 260;
const MAX = 300;
const y = (v: number) => H - (Math.min(v, MAX) / MAX) * H;

export default function Gauge({ cm, tone }: { cm: number; tone: string }) {
  return (
    <svg viewBox="0 0 150 280" className="gauge" role="img" aria-label={`Vara de nivel: ${cm} cm`}>
      <g transform="translate(0,10)">
        <rect x="50" y="0" width="40" height={H} rx="4" className="g-bg" />
        <rect x="50" width="40" className={`g-water ${tone}`} y={y(cm)} height={H - y(cm)} />
        {[0, 50, 100, 150, 200, 250, 300].map((v) => (
          <g key={v}>
            <line x1="42" x2="54" y1={y(v)} y2={y(v)} className="g-tick" />
            <text x="36" y={y(v) + 4} textAnchor="end" className="g-num">
              {v}
            </text>
          </g>
        ))}
        <line x1="50" x2="100" y1={y(THRESHOLDS.critical)} y2={y(THRESHOLDS.critical)} className="thr" />
        <text x="104" y={y(THRESHOLDS.critical) + 4} className="thr-label">78 cm</text>
      </g>
    </svg>
  );
}
