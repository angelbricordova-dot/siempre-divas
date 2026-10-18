"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertOwner } from "@/lib/auth";
import { toCents } from "@/lib/money";

const { ticketItems, tickets, advances, payouts } = schema;

export async function payStaff(formData: FormData) {
  await assertOwner();
  const staffId = Number(formData.get("staffId"));
  const method = String(formData.get("method") || "efectivo");
  const note = String(formData.get("note") ?? "").trim() || null;

  const payoutId = await db.transaction(async (tx) => {
    const items = await tx
      .select({ id: ticketItems.id, net: ticketItems.netPrice, staffAmount: ticketItems.staffAmount, paidAt: tickets.paidAt })
      .from(ticketItems)
      .innerJoin(tickets, eq(tickets.id, ticketItems.ticketId))
      .where(and(eq(ticketItems.staffId, staffId), eq(tickets.status, "pagado"), isNull(ticketItems.payoutId)));
    const tipRows = await tx
      .select({ id: tickets.id, tip: tickets.tip })
      .from(tickets)
      .where(and(eq(tickets.tipStaffId, staffId), eq(tickets.status, "pagado"), isNull(tickets.tipPayoutId), sql`${tickets.tip} > 0`));
    const advRows = await tx
      .select({ id: advances.id, amount: advances.amount })
      .from(advances)
      .where(and(eq(advances.staffId, staffId), isNull(advances.payoutId)));

    if (!items.length && !tipRows.length && !advRows.length) return null;

    const commission = items.reduce((a, i) => a + i.staffAmount, 0);
    const tips = tipRows.reduce((a, t) => a + t.tip, 0);
    const adv = advRows.reduce((a, r) => a + r.amount, 0);
    const dates = items.map((i) => i.paidAt!.getTime());
    const [p] = await tx
      .insert(payouts)
      .values({
        staffId,
        periodStart: dates.length ? new Date(Math.min(...dates)) : null,
        periodEnd: new Date(),
        servicesCount: items.length,
        grossSales: items.reduce((a, i) => a + i.net, 0),
        commission,
        tips,
        advances: adv,
        total: commission + tips - adv,
        method,
        note,
      })
      .returning({ id: payouts.id });
    if (items.length) await tx.update(ticketItems).set({ payoutId: p.id }).where(inArray(ticketItems.id, items.map((i) => i.id)));
    if (tipRows.length) await tx.update(tickets).set({ tipPayoutId: p.id }).where(inArray(tickets.id, tipRows.map((t) => t.id)));
    if (advRows.length) await tx.update(advances).set({ payoutId: p.id }).where(inArray(advances.id, advRows.map((a) => a.id)));
    return p.id;
  });

  revalidatePath("/admin", "layout");
  redirect(payoutId ? `/admin/cuentas/pago/${payoutId}` : `/admin/cuentas/${staffId}`);
}

export async function addAdvance(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const staffId = Number(formData.get("staffId"));
    const amount = toCents(String(formData.get("amount") ?? ""));
    if (!staffId || amount <= 0) return { error: "Escribe el monto del adelanto." };
    await db.insert(advances).values({
      staffId,
      amount,
      method: String(formData.get("method") || "efectivo"),
      note: String(formData.get("note") ?? "").trim() || null,
    });
    revalidatePath("/admin", "layout");
    return { ok: "Adelanto registrado. Se descontará en el próximo pago." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function deleteAdvance(formData: FormData) {
  await assertOwner();
  const id = Number(formData.get("id"));
  await db.delete(advances).where(and(eq(advances.id, id), isNull(advances.payoutId)));
  revalidatePath("/admin", "layout");
}
