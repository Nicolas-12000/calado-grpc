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
