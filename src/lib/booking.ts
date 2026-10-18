import "server-only";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Settings, Staff } from "@/db/schema";
import { atLocal, endOfDay, localDate, minutesOf, startOfDay, timeOf, weekday } from "./time";

export type Slot = { time: string; staffIds: number[] };

function canDo(worker: Staff, categoryIds: number[]) {
  if (worker.categoryIds.length === 0) return true;
  return categoryIds.every((c) => worker.categoryIds.includes(c));
}

export async function eligibleStaff(date: string, categoryIds: number[]) {
  const wd = weekday(date);
  const rows = await db
    .select()
    .from(schema.staff)
    .where(and(eq(schema.staff.active, true), eq(schema.staff.bookable, true)))
    .orderBy(schema.staff.sort, schema.staff.name);
  // La dueña queda al final: "quien esté libre" asigna primero al equipo.
  return rows
    .filter((w) => !w.daysOff.includes(wd) && canDo(w, categoryIds))
    .sort((a, b) => Number(a.role === "owner") - Number(b.role === "owner"));
}

export async function getSlots(opts: {
  settings: Settings;
  date: string;
  durationMin: number;
  categoryIds: number[];
  staffId?: number | null;
  ignoreAppointmentId?: number;
}): Promise<Slot[]> {
  const { settings, date, durationMin, categoryIds, staffId } = opts;
  const hours = settings.hours[weekday(date)];
  if (!hours) return [];
  let workers = await eligibleStaff(date, categoryIds);
  if (staffId) workers = workers.filter((w) => w.id === staffId);
  if (workers.length === 0) return [];

  const busy = await db
    .select({
      id: schema.appointments.id,
      staffId: schema.appointments.staffId,
      startsAt: schema.appointments.startsAt,
      endsAt: schema.appointments.endsAt,
    })
    .from(schema.appointments)
    .where(
      and(
        gte(schema.appointments.startsAt, startOfDay(date)),
        lt(schema.appointments.startsAt, endOfDay(date)),
        inArray(schema.appointments.status, ["pendiente", "confirmada"]),
      ),
    );

  const now = Date.now();
  const earliest = now + settings.minNoticeMinutes * 60_000;
  const open = minutesOf(hours.open);
  const close = minutesOf(hours.close);
  const step = Math.max(10, settings.slotMinutes);
  const slots: Slot[] = [];

  for (let m = open; m + durationMin <= close; m += step) {
    const start = atLocal(date, timeOf(m)).getTime();
    if (start < earliest) continue;
    const end = start + durationMin * 60_000;
    const free = workers
      .filter(
        (w) =>
          !busy.some(
            (b) =>
              b.id !== opts.ignoreAppointmentId &&
              b.staffId === w.id &&
              b.startsAt.getTime() < end &&
              b.endsAt.getTime() > start,
          ),
      )
      .map((w) => w.id);
    if (free.length) slots.push({ time: timeOf(m), staffIds: free });
  }
  return slots;
}

/** Primer turno libre desde hoy, para mostrarlo en la portada. */
export async function nextOpenSlot(settings: Settings, durationMin = 45) {
  let date = localDate();
  for (let i = 0; i < 14; i++) {
    const slots = await getSlots({ settings, date, durationMin, categoryIds: [] });
    if (slots.length) return { date, time: slots[0].time };
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    date = d.toISOString().slice(0, 10);
  }
  return null;
}
