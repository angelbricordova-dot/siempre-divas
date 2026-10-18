"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { PAYMENT_METHODS } from "@/db/schema";
import { buildItems } from "@/lib/accounting";
import { assertOwner, assertUser } from "@/lib/auth";
import { resolveClient } from "@/lib/clients";
import { money } from "@/lib/money";
import { notifyOwner } from "@/lib/notify";

const TicketInput = z.object({
  ticketId: z.number().int().positive().nullable().optional(),
  appointmentId: z.number().int().positive().nullable().optional(),
  mode: z.enum(["charge", "pending"]),
  items: z
    .array(
      z.object({
        serviceId: z.number().int().positive().nullable(),
        description: z.string().trim().min(1).max(120),
        staffId: z.number().int().positive().nullable(),
        price: z.number().int().min(0).max(1_000_000),
      }),
    )
    .min(1, "Agrega al menos un servicio"),
  discount: z.number().int().min(0).default(0),
  tip: z.number().int().min(0).default(0),
  tipStaffId: z.number().int().positive().nullable().optional(),
  method: z.enum(PAYMENT_METHODS).nullable().optional(),
  client: z
    .object({
      id: z.number().int().positive().nullable().optional(),
      name: z.string().trim().max(80).nullable().optional(),
      phone: z.string().trim().max(30).nullable().optional(),
    })
    .optional(),
  notes: z.string().trim().max(300).nullable().optional(),
});

export type TicketInputT = z.infer<typeof TicketInput>;

export type SaveTicketResult =
  | { ok: true; ticketId: number; total: number; status: "pagado" | "pendiente"; split: { name: string; amount: number }[]; salon: number }
  | { ok: false; error: string };

export async function saveTicket(raw: TicketInputT): Promise<SaveTicketResult> {
  try {
    const user = await assertUser();
    const input = TicketInput.parse(raw);
    if (input.mode === "charge" && user.role !== "owner") {
      return { ok: false, error: "Solo la dueña puede cobrar. Envía el servicio a caja." };
    }
    if (input.mode === "charge" && !input.method) {
      return { ok: false, error: "Elige cómo pagó la clienta." };
    }
    // Una trabajadora solo puede registrar servicios a su nombre.
    const items =
      user.role === "owner" ? input.items : input.items.map((i) => ({ ...i, staffId: user.id }));

    const built = await buildItems(items, input.discount);
    const subtotal = items.reduce((a, i) => a + i.price, 0);
    const discount = Math.min(input.discount, subtotal);
    const total = subtotal - discount;
    const tipStaffId = input.tip > 0 ? (input.tipStaffId ?? items[0].staffId ?? null) : null;
    const client = input.client ? await resolveClient(input.client) : null;

    const ticketId = await db.transaction(async (tx) => {
      const values = {
        clientId: client?.id ?? null,
        clientName: client?.name ?? input.client?.name ?? null,
        appointmentId: input.appointmentId ?? null,
        status: input.mode === "charge" ? ("pagado" as const) : ("pendiente" as const),
        paymentMethod: input.mode === "charge" ? input.method! : null,
        subtotal,
        discount,
        total,
        tip: input.tip,
        tipStaffId,
        notes: input.notes ?? null,
        paidAt: input.mode === "charge" ? new Date() : null,
      };
      let id: number;
      if (input.ticketId) {
        const [existing] = await tx.select().from(schema.tickets).where(eq(schema.tickets.id, input.ticketId));
        if (!existing || existing.status !== "pendiente") throw new Error("Este ticket ya fue cobrado o anulado.");
        if (user.role !== "owner" && existing.createdById !== user.id) throw new Error("No puedes editar este ticket.");
        await tx.update(schema.tickets).set(values).where(eq(schema.tickets.id, existing.id));
        await tx.delete(schema.ticketItems).where(eq(schema.ticketItems.ticketId, existing.id));
        id = existing.id;
      } else {
        const [row] = await tx
          .insert(schema.tickets)
          .values({ ...values, createdById: user.id })
          .returning({ id: schema.tickets.id });
        id = row.id;
      }
      await tx.insert(schema.ticketItems).values(built.map((b) => ({ ...b, ticketId: id })));
      if (input.appointmentId && input.mode === "charge") {
        await tx
          .update(schema.appointments)
          .set({ status: "completada", ticketId: id })
          .where(eq(schema.appointments.id, input.appointmentId));
      }
      return id;
    });

    if (input.mode === "pending" && user.role !== "owner") {
      await notifyOwner({
        title: `Por cobrar: ${money(total)}`,
        body: `${user.name} registró ${built.map((b) => b.description).join(", ")}${client ? ` para ${client.name}` : ""}.`,
        url: `/admin/caja?ticket=${ticketId}`,
        whatsapp: `💳 *Por cobrar ${money(total)}*\n${user.name}: ${built.map((b) => `${b.description} ${money(b.price)}`).join(", ")}${client ? `\nClienta: ${client.name}` : ""}`,
      });
    }

    revalidatePath("/admin", "layout");
    const byStaff = new Map<string, number>();
    const staffRows = await db.select({ id: schema.staff.id, name: schema.staff.name }).from(schema.staff);
    for (const b of built) {
      if (b.staffAmount <= 0) continue;
      const name = staffRows.find((s) => s.id === b.staffId)?.name ?? "—";
      byStaff.set(name, (byStaff.get(name) ?? 0) + b.staffAmount);
    }
    return {
      ok: true,
      ticketId,
      total,
      status: input.mode === "charge" ? "pagado" : "pendiente",
      split: [...byStaff.entries()].map(([name, amount]) => ({ name, amount })),
      salon: built.reduce((a, b) => a + b.salonAmount, 0),
    };
  } catch (err) {
    const msg =
      err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "No se pudo guardar";
    return { ok: false, error: msg ?? "No se pudo guardar" };
  }
}

export async function voidTicket(formData: FormData) {
  await assertOwner();
  const id = Number(formData.get("id"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const paidOut = await db
    .select({ id: schema.ticketItems.id })
    .from(schema.ticketItems)
    .where(and(eq(schema.ticketItems.ticketId, id), isNotNull(schema.ticketItems.payoutId)));
  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
  if (!t) return;
  if (paidOut.length || t.tipPayoutId) {
    throw new Error("Este cobro ya entró en un pago a la trabajadora; no se puede anular.");
  }
  await db.update(schema.tickets).set({ status: "anulado", voidReason: reason }).where(eq(schema.tickets.id, id));
  if (t.appointmentId) {
    await db
      .update(schema.appointments)
      .set({ status: "confirmada", ticketId: null })
      .where(eq(schema.appointments.id, t.appointmentId));
  }
  revalidatePath("/admin", "layout");
}

export async function deletePendingTicket(formData: FormData) {
  const user = await assertUser();
  const id = Number(formData.get("id"));
  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
  if (!t || t.status !== "pendiente") return;
  if (user.role !== "owner" && t.createdById !== user.id) return;
  await db.delete(schema.tickets).where(eq(schema.tickets.id, id));
  revalidatePath("/admin", "layout");
}
