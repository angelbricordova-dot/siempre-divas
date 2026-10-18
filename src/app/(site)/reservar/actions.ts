"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createAppointment } from "@/lib/appointments";
import { normalizePhone } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { addDays, localDate } from "@/lib/time";
import { signId } from "@/lib/token";

const Input = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  serviceIds: z.array(z.number().int().positive()).min(1, "Elige al menos un servicio").max(6),
  staffId: z.number().int().positive().nullable(),
  name: z.string().trim().min(2, "Escribe tu nombre").max(60),
  phone: z.string().trim().min(9, "Escribe tu número de WhatsApp").max(20),
  notes: z.string().trim().max(240).optional(),
  website: z.string().max(0).optional(), // trampa para bots
});

export async function bookOnline(raw: z.infer<typeof Input>): Promise<{ ok: true; id: number; token: string } | { ok: false; error: string }> {
  try {
    const input = Input.parse(raw);
    const settings = await getSettings();
    if (!settings.bookingEnabled) return { ok: false, error: "Por ahora las reservas son solo por WhatsApp." };
    const today = localDate();
    if (input.date < today || input.date > addDays(today, settings.maxDaysAhead)) {
      return { ok: false, error: "Elige una fecha dentro del calendario." };
    }
    const phone = normalizePhone(input.phone);
    if (!phone || phone.length < 11) return { ok: false, error: "Revisa tu número de WhatsApp." };

    // Evita reservas en masa desde un mismo número.
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.clientPhone, phone),
          inArray(schema.appointments.status, ["pendiente", "confirmada"]),
          gte(schema.appointments.startsAt, new Date()),
        ),
      );
    if (n >= 3) return { ok: false, error: "Ya tienes varias citas por venir. Escríbenos por WhatsApp para agendar otra." };

    const appt = await createAppointment({
      date: input.date,
      time: input.time,
      serviceIds: input.serviceIds,
      staffId: input.staffId,
      client: { name: input.name, phone },
      notes: input.notes || null,
      source: "web",
      status: "pendiente",
    });
    return { ok: true, id: appt.id, token: signId(appt.id) };
  } catch (err) {
    const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : null;
    return { ok: false, error: msg ?? "No pudimos guardar tu cita. Intenta de nuevo." };
  }
}
