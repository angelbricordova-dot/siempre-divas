"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createAppointment } from "@/lib/appointments";
import { assertUser } from "@/lib/auth";
import { atLocal } from "@/lib/time";

const Input = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  serviceIds: z.array(z.number().int().positive()).min(1, "Elige al menos un servicio"),
  staffId: z.number().int().positive().nullable(),
  client: z.object({
    id: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(2, "Escribe el nombre de la clienta").max(80),
    phone: z.string().trim().max(30).nullable().optional(),
  }),
  notes: z.string().trim().max(300).nullable().optional(),
  allowOverlap: z.boolean().optional(),
});

export async function saveAppointment(raw: z.infer<typeof Input>): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  try {
    const user = await assertUser();
    const input = Input.parse(raw);
    const appt = await createAppointment({
      ...input,
      source: user.role === "owner" ? "admin" : "staff",
      createdById: user.id,
      allowOverlap: user.role === "owner" && input.allowOverlap,
    });
    revalidatePath("/admin", "layout");
    return { ok: true, id: appt.id };
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : null;
    return { ok: false, error: msg ?? "No se pudo guardar la cita" };
  }
}

const STATUSES = ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"] as const;

export async function setAppointmentStatus(formData: FormData) {
  const user = await assertUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return;
  const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
  if (!appt) return;
  if (user.role !== "owner" && appt.staffId !== user.id) return;
  await db.update(schema.appointments).set({ status }).where(eq(schema.appointments.id, id));
  if (status === "no_asistio" && appt.clientId && appt.status !== "no_asistio") {
    const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, appt.clientId));
    if (c) await db.update(schema.clients).set({ noShows: c.noShows + 1 }).where(eq(schema.clients.id, c.id));
  }
  revalidatePath("/admin", "layout");
}

export async function rescheduleAppointment(formData: FormData) {
  const user = await assertUser();
  const id = Number(formData.get("id"));
  const date = String(formData.get("date"));
  const time = String(formData.get("time"));
  const staffId = Number(formData.get("staffId")) || null;
  const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
  if (!appt) return;
  if (user.role !== "owner" && appt.staffId !== user.id) return;
  const duration = appt.endsAt.getTime() - appt.startsAt.getTime();
  const startsAt = atLocal(date, time);
  if (Number.isNaN(startsAt.getTime())) return;
  await db
    .update(schema.appointments)
    .set({ startsAt, endsAt: new Date(startsAt.getTime() + duration), staffId: staffId ?? appt.staffId })
    .where(eq(schema.appointments.id, id));
  revalidatePath("/admin", "layout");
}

export async function deleteAppointment(formData: FormData) {
  const user = await assertUser();
  const id = Number(formData.get("id"));
  const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id));
  if (!appt || (user.role !== "owner" && appt.createdById !== user.id)) return;
  await db.delete(schema.appointments).where(eq(schema.appointments.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin/agenda");
}
