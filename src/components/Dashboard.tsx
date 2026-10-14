"use client";

import { useEffect, useState } from "react";
import { create, toBinary } from "@bufbuild/protobuf";

import { HistoryResponseSchema, type Reading } from "@/gen/calado/v1/calado_pb";
import { calado } from "@/lib/client";
import { fmtDateTime } from "@/lib/format";
import { statusOf } from "@/lib/status";

import Chart from "./Chart";
import Gauge from "./Gauge";

type Mode = "loading" | "idle" | "streaming";

export default function Dashboard() {
  const [data, setData] = useState<Reading[]>([]);
  const [mode, setMode] = useState<Mode>("loading");
  const [error, setError] = useState("");

  const run = async (stream: boolean) => {
    setError("");
    setData([]);
    setMode(stream ? "streaming" : "loading");
    try {
      if (stream) {
        const acc: Reading[] = [];
        for await (const r of calado.replay({ days: 14 })) {
          acc.push(r);
          setData([...acc]);
        }
      } else {
        setData((await calado.getHistory({ days: 14 })).readings);
      }
    } catch (e) {
      setError(`No llegan los datos del Rin. Reintenta en unos segundos. (${(e as Error).message})`);
    }
    setMode("idle");
  };

  useEffect(() => {
    void run(false);
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
            <b>Unario:</b> pide 14 días de una vez.
          </li>
          <li>
            <b>Streaming:</b> el servidor envía hora a hora, como time-lapse.
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
          <button className="primary" disabled={busy} onClick={() => run(false)}>
            Pedir 14 días
          </button>
          <button className="quiet" disabled={busy} onClick={() => run(true)}>
            Ver en streaming
          </button>
        </div>
        <Chart
          data={data}
          placeholder={mode === "loading" ? "Cargando datos del Rin…" : "Pulsa un botón para pedir datos."}
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
