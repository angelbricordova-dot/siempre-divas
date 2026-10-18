"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { assertOwner } from "@/lib/auth";
import { toCents } from "@/lib/money";
import { localDate } from "@/lib/time";

export async function addExpense(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const amount = toCents(String(formData.get("amount") ?? ""));
    if (amount <= 0) return { error: "Escribe el monto." };
    await db.insert(schema.expenses).values({
      date: String(formData.get("date") || localDate()),
      category: String(formData.get("category") || "Otros"),
      description: String(formData.get("description") ?? "").trim() || null,
      amount,
      method: String(formData.get("method") || "efectivo"),
    });
    revalidatePath("/admin", "layout");
    return { ok: "Gasto anotado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function deleteExpense(formData: FormData) {
  await assertOwner();
  await db.delete(schema.expenses).where(eq(schema.expenses.id, Number(formData.get("id"))));
  revalidatePath("/admin", "layout");
}
