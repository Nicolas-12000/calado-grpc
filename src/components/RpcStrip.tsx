export type RpcTrace = {
  method: "GetHistory" | "Replay";
  kind: "unary" | "server_streaming";
  ms: number;
  /** Lecturas recibidas (un mensaje unario o N mensajes de stream). */
  readings: number;
  live?: boolean;
};

const SERVICE = "calado.v1.CaladoService";

export default function RpcStrip({ trace }: { trace: RpcTrace | null }) {
  if (!trace) return null;

  const path = `${SERVICE}/${trace.method}`;
  const timing = trace.live ? "en curso…" : `${trace.ms} ms`;

  return (
    <p className="rpc-strip" aria-live="polite">
      <code>Connect</code>
      <span className="sep">·</span>
      Protobuf binario
      <span className="sep">·</span>
      <code>{path}</code>
      <span className="sep">·</span>
      {trace.kind === "unary" ? "unario (1 round-trip)" : "server streaming"}
      <span className="sep">·</span>
      <b>{trace.readings}</b> {trace.readings === 1 ? "lectura" : "lecturas"}
      <span className="sep">·</span>
      {timing}
    </p>
  );
}
