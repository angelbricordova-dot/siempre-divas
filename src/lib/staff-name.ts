/** "Andrea Pérez" a partir de nombre y apellido. */
export function fullName(s: { name: string; lastName?: string | null }) {
  return [s.name, s.lastName].filter(Boolean).join(" ").trim();
}

/** Cargo a mostrar: el cargo, o "Dueña" para la dueña, o la especialidad. */
export function positionOf(s: { role: string; position?: string | null; specialty?: string | null }) {
  return s.position || (s.role === "owner" ? "Dueña" : s.specialty) || null;
}

export const POSITIONS = [
  "Estilista",
  "Colorista",
  "Manicurista",
  "Pedicurista",
  "Técnica en uñas",
  "Maquilladora",
  "Cosmetóloga",
  "Lashista / Cejas",
  "Barbero",
  "Recepcionista",
  "Asistente",
];
