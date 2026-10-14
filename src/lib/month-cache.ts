import type { Reading } from "@/gen/calado/v1/calado_pb";

const KEY = "calado-month-v1";
/** Reutilizar el mes en el navegador antes de volver a Pegelonline. */
export const MONTH_CACHE_TTL_MS = 2 * 24 * 60 * 60 * 1000;

type Entry = { at: number; days: number; readings: { ts: number; cm: number }[] };

export function readMonthCache(days: number): { readings: Reading[]; at: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const e = JSON.parse(raw) as Entry;
    if (e.days !== days || Date.now() - e.at > MONTH_CACHE_TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return { readings: e.readings as Reading[], at: e.at };
  } catch {
    return null;
  }
}

export function writeMonthCache(days: number, readings: Reading[]) {
  try {
    const payload: Entry = {
      at: Date.now(),
      days,
      readings: readings.map((r) => ({ ts: r.ts, cm: r.cm })),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota / modo privado */
  }
}

export function clearMonthCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
