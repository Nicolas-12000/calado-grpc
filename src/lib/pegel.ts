// Fuente: Pegelonline (WSV, Alemania). API pública, sin clave.
const BASE = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/KAUB/W";

export async function fetchReadings(days: number) {
  const d = Math.min(Math.max(days || 7, 1), 30);
  const res = await fetch(`${BASE}/measurements.json?start=P${d}D`, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Pegelonline respondió ${res.status}`);
  const raw = (await res.json()) as { timestamp: string; value: number }[];
  // cada 4.º dato de 15 min = 1 punto por hora
  return raw
    .filter((_, i) => i % 4 === 0)
    .map((m) => ({
      ts: Math.floor(Date.parse(m.timestamp) / 1000),
      cm: Math.round(m.value),
    }))
    // Pegelonline usa -1 (u otros negativos) cuando no hay medición; cm es uint32 en el .proto.
    .filter((r) => r.ts > 0 && Number.isFinite(r.cm) && r.cm >= 0);
}
