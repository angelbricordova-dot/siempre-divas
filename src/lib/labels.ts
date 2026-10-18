export const STATUS_LABEL: Record<string, { label: string; tone: "neutral" | "ok" | "warn" | "bad" | "gold" }> = {
  pendiente: { label: "Por confirmar", tone: "warn" },
  confirmada: { label: "Confirmada", tone: "ok" },
  completada: { label: "Atendida", tone: "neutral" },
  cancelada: { label: "Cancelada", tone: "bad" },
  no_asistio: { label: "No vino", tone: "bad" },
};

export const METHOD_LABEL: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  deuna: "De Una",
};

export const EXPENSE_CATEGORIES = [
  "Productos e insumos",
  "Arriendo",
  "Servicios básicos",
  "Publicidad",
  "Mantenimiento",
  "Comida y varios",
  "Otros",
] as const;
