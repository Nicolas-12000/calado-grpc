const opts = { timeZone: "Europe/Berlin" } as const;

export const fmtDateTime = (ts: number) =>
  new Date(ts * 1000).toLocaleString("es-CO", {
    ...opts,
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  });

export const fmtDay = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("es-CO", { ...opts, day: "numeric", month: "short" });

export const fmtAgo = (atMs: number) => {
  const h = Math.round((Date.now() - atMs) / 3_600_000);
  if (h < 1) return "hace un momento";
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
};
