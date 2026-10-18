"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { expectedCash } from "@/lib/accounting";
import { assertOwner } from "@/lib/auth";
import { toCents } from "@/lib/money";
import { localDate } from "@/lib/time";

export async function closeDay(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const date = String(formData.get("date") || localDate());
    const counted = toCents(String(formData.get("counted") ?? ""));
    const note = String(formData.get("note") ?? "").trim() || null;
    const exp = await expectedCash(date);
    await db
      .insert(schema.cashClosures)
      .values({ date, expectedCash: exp.expected, countedCash: counted, note })
      .onConflictDoUpdate({
        target: schema.cashClosures.date,
        set: { expectedCash: exp.expected, countedCash: counted, note, createdAt: new Date() },
      });
    revalidatePath("/admin/cierre");
    const diff = counted - exp.expected;
    return { ok: diff === 0 ? "Caja cuadrada. ¡Perfecto!" : diff > 0 ? `Sobran $${(diff / 100).toFixed(2)}. Quedó anotado.` : `Faltan $${(-diff / 100).toFixed(2)}. Quedó anotado.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}
