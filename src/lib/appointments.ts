import "server-only";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import type { AppointmentItem } from "@/db/schema";
import { resolveClient } from "./clients";
import { eligibleStaff } from "./booking";
import { atLocal, localDate, localTime, prettyDate, prettyTime } from "./time";
import { money } from "./money";
import { notifyOwner } from "./notify";
import { prettyPhone } from "./phone";

export type NewAppointment = {
  date: string;
  time: string;
  serviceIds: number[];
  staffId: number | null;
  client: { id?: number | null; name: string; phone?: string | null };
  notes?: string | null;
  source: "web" | "staff" | "admin";
  createdById?: number | null;
  status?: "pendiente" | "confirmada";
  allowOverlap?: boolean;
};

export async function createAppointment(input: NewAppointment) {
  const svcs = input.serviceIds.length
    ? await db.select().from(schema.services).where(inArray(schema.services.id, input.serviceIds))
    : [];
  if (svcs.length === 0) throw new Error("Elige al menos un servicio.");
  const items: AppointmentItem[] = input.serviceIds
    .map((id) => svcs.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ serviceId: s.id, name: s.name, price: s.price, durationMin: s.durationMin }));
  const duration = items.reduce((a, i) => a + i.durationMin, 0);
  const startsAt = atLocal(input.date, input.time);
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Fecha u hora inválida.");

  const categoryIds = [...new Set(svcs.map((s) => s.categoryId))];
  const candidates = input.staffId
    ? [input.staffId]
    : (await eligibleStaff(input.date, categoryIds)).map((w) => w.id);
  if (candidates.length === 0) throw new Error("No hay nadie disponible para ese servicio ese día.");

  const overlapping = await db
    .select({ staffId: schema.appointments.staffId })
    .from(schema.appointments)
    .where(
      and(
        inArray(schema.appointments.staffId, candidates),
        inArray(schema.appointments.status, ["pendiente", "confirmada"]),
        lt(schema.appointments.startsAt, endsAt),
        gt(schema.appointments.endsAt, startsAt),
      ),
    );
  const busy = new Set(overlapping.map((o) => o.staffId));
  const free = candidates.filter((c) => !busy.has(c));
  if (free.length === 0 && !input.allowOverlap) {
    throw new Error("Ese horario acaba de ocuparse. Elige otro, por favor.");
  }
  const staffId = free[0] ?? candidates[0];
  const client = await resolveClient(input.client);
  const [appt] = await db
    .insert(schema.appointments)
    .values({
      clientId: client?.id ?? null,
      clientName: client?.name ?? input.client.name,
      clientPhone: client?.phone ?? null,
      staffId,
      startsAt,
      endsAt,
      items,
      status: input.status ?? (input.source === "web" ? "pendiente" : "confirmada"),
      source: input.source,
      notes: input.notes ?? null,
      createdById: input.createdById ?? null,
    })
    .returning();

  const [worker] = await db.select({ name: schema.staff.name }).from(schema.staff).where(eq(schema.staff.id, staffId));
  const total = items.reduce((a, i) => a + i.price, 0);
  const when = `${prettyDate(input.date)} a las ${prettyTime(input.time)}`;
  const origin = input.source === "web" ? " desde la web" : input.source === "staff" ? " del equipo" : "";
  // La dueña no necesita avisarse a sí misma.
  if (input.source !== "admin") await notifyOwner({
    title: `Nueva cita${origin}`,
    body: `${appt.clientName} · ${items.map((i) => i.name).join(", ")} · ${when} con ${worker?.name ?? "—"}`,
    url: `/admin/agenda/${appt.id}`,
    whatsapp: [
      `📅 *Nueva cita${origin}*`,
      `👤 ${appt.clientName}${appt.clientPhone ? ` (${prettyPhone(appt.clientPhone)})` : ""}`,
      `💅 ${items.map((i) => i.name).join(", ")}`,
      `🕒 ${when}`,
      `✂️ Con ${worker?.name ?? "—"}`,
      `💵 Aprox. ${money(total)}`,
      input.notes ? `📝 ${input.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
  return appt;
}

export function appointmentSummary(a: { startsAt: Date; items: AppointmentItem[] }) {
  return {
    date: localDate(a.startsAt),
    time: localTime(a.startsAt),
    services: a.items.map((i) => i.name).join(", "),
    total: a.items.reduce((s, i) => s + i.price, 0),
  };
}

