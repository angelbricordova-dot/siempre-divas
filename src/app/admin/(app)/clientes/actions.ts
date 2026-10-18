"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertOwner, assertUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function saveClient(_: unknown, formData: FormData) {
  try {
    await assertUser();
    const id = Number(formData.get("id")) || null;
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return { error: "Escribe el nombre." };
    const phone = normalizePhone(String(formData.get("phone") ?? ""));
    const birthday = String(formData.get("birthday") ?? "") || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    if (phone) {
      const [dupe] = await db.select().from(schema.clients).where(eq(schema.clients.phone, phone));
      if (dupe && dupe.id !== id) return { error: `Ese número ya es de ${dupe.name}.` };
    }
    if (id) {
      await db.update(schema.clients).set({ name, phone, birthday, notes }).where(eq(schema.clients.id, id));
      revalidatePath(`/admin/clientes/${id}`);
      return { ok: "Guardado." };
    }
    const [c] = await db.insert(schema.clients).values({ name, phone, birthday, notes }).returning();
    redirect(`/admin/clientes/${c.id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function deleteClient(formData: FormData) {
  await assertOwner();
  await db.delete(schema.clients).where(eq(schema.clients.id, Number(formData.get("id"))));
  redirect("/admin/clientes");
}
