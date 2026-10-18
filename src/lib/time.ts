// Guayaquil está en UTC−5 todo el año (sin horario de verano).
export const TZ = "America/Guayaquil";
const OFFSET = "-05:00";
const OFFSET_MS = 5 * 60 * 60 * 1000;

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Fecha local (YYYY-MM-DD) en Guayaquil para un instante. */
export function localDate(d: Date = new Date()): string {
  return new Date(d.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

/** Hora local (HH:MM) en Guayaquil. */
export function localTime(d: Date): string {
  return new Date(d.getTime() - OFFSET_MS).toISOString().slice(11, 16);
}

/** Instante UTC para una fecha y hora locales de Guayaquil. */
export function atLocal(date: string, time = "00:00"): Date {
  return new Date(`${date}T${time}:00${OFFSET}`);
}

export function startOfDay(date: string): Date {
  return atLocal(date, "00:00");
}

export function endOfDay(date: string): Date {
  return new Date(atLocal(date, "00:00").getTime() + 24 * 60 * 60 * 1000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Inicio de la semana de cuentas que contiene la fecha. */
export function weekStart(date: string, weekStartsOn: number): string {
  const diff = (weekday(date) - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export function monthStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeOf(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "3:30 p. m." */
export function prettyTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "martes 21 de octubre" */
export function prettyDate(date: string, opts: { year?: boolean } = {}): string {
  const [y, mo, d] = date.split("-").map(Number);
  const wd = DAY_NAMES[weekday(date)].toLowerCase();
  return `${wd} ${d} de ${MONTHS[mo - 1]}${opts.year ? ` de ${y}` : ""}`;
}

/** "21 oct" */
export function shortDate(date: string): string {
  const [, mo, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[mo - 1].slice(0, 3)}`;
}

export function relativeDay(date: string, today = localDate()): string {
  if (date === today) return "Hoy";
  if (date === addDays(today, 1)) return "Mañana";
  if (date === addDays(today, -1)) return "Ayer";
  const label = prettyDate(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
