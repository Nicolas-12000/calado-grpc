"use client";

import { useEffect, useState } from "react";
import { create, toBinary } from "@bufbuild/protobuf";

import { HistoryResponseSchema, type Reading } from "@/gen/calado/v1/calado_pb";
import { calado } from "@/lib/client";
import { fmtAgo, fmtDateTime } from "@/lib/format";
import { readMonthCache, writeMonthCache } from "@/lib/month-cache";
import { statusOf } from "@/lib/status";

import Chart from "./Chart";
import Gauge from "./Gauge";

type Mode = "loading" | "idle" | "streaming";
type View = "month" | "week";

/** Máximo que admite el .proto y Pegelonline en esta UI. */
const DAYS_MONTH = 30;
const DAYS_WEEK = 7;

export default function Dashboard() {
  const [data, setData] = useState<Reading[]>([]);
  const [mode, setMode] = useState<Mode>("loading");
  const [view, setView] = useState<View>("month");
  const [error, setError] = useState("");
  const [monthCachedAt, setMonthCachedAt] = useState<number | null>(null);

  const loadMonth = async (force: boolean) => {
    setError("");
    setView("month");
    setMonthCachedAt(null);

    if (!force) {
      const hit = readMonthCache(DAYS_MONTH);
      if (hit) {
        setData(hit.readings);
        setMonthCachedAt(hit.at);
        setMode("idle");
        return;
      }
    }

    setData([]);
    setMode("loading");
    try {
      const readings = (await calado.getHistory({ days: DAYS_MONTH })).readings;
      setData(readings);
      writeMonthCache(DAYS_MONTH, readings);
      setMonthCachedAt(Date.now());
    } catch (e) {
      setError(`No llegan los datos del Rin. Reintenta en unos segundos. (${(e as Error).message})`);
    }
    setMode("idle");
  };

  const runWeekStream = async () => {
    setError("");
    setData([]);
    setView("week");
    setMonthCachedAt(null);
    setMode("streaming");
    try {
      const acc: Reading[] = [];
      for await (const r of calado.replay({ days: DAYS_WEEK })) {
        acc.push(r);
        // Actualiza la UI en cada punto (≈1/h); Pegelonline ya se consultó una sola vez arriba.
        setData([...acc]);
      }
    } catch (e) {
      setError(`No llegan los datos del Rin. Reintenta en unos segundos. (${(e as Error).message})`);
    }
    setMode("idle");
  };

  useEffect(() => {
    void loadMonth(false);
  }, []);

  const last = data.at(-1);
  const st = last ? statusOf(last.cm) : null;
  const cms = data.map((d) => d.cm);
  const day = data.length > 24 ? last!.cm - data[data.length - 25].cm : null;
  const pb = data.length
    ? toBinary(HistoryResponseSchema, create(HistoryResponseSchema, { readings: data })).length
    : 0;
  const json = data.length
    ? JSON.stringify(data.map((r) => ({ timestamp: new Date(r.ts * 1000).toISOString(), value: r.cm }))).length
    : 0;
  const busy = mode !== "idle";

  return (
    <section className="grid">
      <div className="side">
        <ul className="steps">
          <li>
            <b>Contrato:</b> un <code>.proto</code> define las dos llamadas.
          </li>
          <li>
            <b>Unario:</b> el mes de una vez; en el navegador se reutiliza unos días.
          </li>
          <li>
            <b>Streaming:</b> un solo fetch de la semana; luego el servidor suelta hora a hora por gRPC.
          </li>
        </ul>
        <div className="gauge-card">
          <Gauge cm={last?.cm ?? 0} tone={st?.key ?? "libre"} />
          {st && last && (
            <div className={`level ${st.key}`}>
              <span className="n">{last.cm}</span>
              <span className="u">cm</span>
              <p>
                <span aria-hidden>{st.icon}</span> {st.label}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="actions">
          <button
            type="button"
            className="primary"
            disabled={busy}
            aria-pressed={view === "month"}
            onClick={() => loadMonth(true)}
          >
            Pedir el mes
          </button>
          <button
            type="button"
            className="quiet"
            disabled={busy}
            aria-pressed={view === "week"}
            onClick={() => runWeekStream()}
          >
            Ver la semana en streaming
          </button>
        </div>
        {(data.length > 0 || mode !== "idle") && (
          <p className="range-hint" aria-live="polite">
            {view === "month"
              ? `Últimos 30 días${monthCachedAt ? ` · guardado ${fmtAgo(monthCachedAt)}` : ""}`
              : mode === "streaming"
                ? "Semana · reproduciendo (1 sola consulta a Pegel al empezar)"
                : "Últimos 7 días · pulsa de nuevo para refrescar la semana"}
          </p>
        )}
        <Chart
          data={data}
          spanDays={view === "month" ? DAYS_MONTH : DAYS_WEEK}
          placeholder={
            mode === "loading"
              ? "Cargando el mes en el Rin…"
              : mode === "streaming"
                ? "Reproduciendo la semana…"
                : "Pulsa un botón para pedir datos."
          }
        />
        {error && <p className="error" role="alert">{error}</p>}

        {data.length > 0 && (
          <div className="stats">
            <div>
              <span className="num">{Math.min(...cms)}</span>
              <small>mínimo (cm)</small>
            </div>
            <div>
              <span className="num">{Math.max(...cms)}</span>
              <small>máximo (cm)</small>
            </div>
            <div>
              <span className="num">
                {day === null ? "–" : `${day > 0 ? "▲" : day < 0 ? "▼" : "="} ${Math.abs(day)}`}
              </span>
              <small>cambio en 24 h (cm)</small>
            </div>
          </div>
        )}
        {pb > 0 && mode === "idle" && (
          <p className="size">
            {data.length} mediciones: <b>{pb} B</b> en Protobuf frente a <b>{json} B</b> en JSON equivalente (
            <b>{Math.round((1 - pb / json) * 100)} % menos</b>).
          </p>
        )}
        <p className="src">
          Fuente: Pegelonline (WSV)
          {last && (
            <>
              {" "}
              · última medición {fmtDateTime(last.ts)}, hora de Berlín
            </>
          )}
          . Umbrales aproximados de la navegación de carga.
        </p>
      </div>
    </section>
  );
}
