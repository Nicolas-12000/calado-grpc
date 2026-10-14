export const THRESHOLDS = { free: 150, critical: 78 }; // cm, aproximados

export function statusOf(cm: number) {
  if (cm >= THRESHOLDS.free) return { key: "libre", icon: "✓", label: "Navegación libre" } as const;
  if (cm >= THRESHOLDS.critical) return { key: "parcial", icon: "!", label: "Barcazas con carga reducida" } as const;
  return { key: "critico", icon: "▼", label: "Tramo crítico" } as const;
}
