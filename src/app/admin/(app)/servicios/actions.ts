"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertOwner } from "@/lib/auth";
import { toCents } from "@/lib/money";

export async function saveService(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const id = Number(formData.get("id")) || null;
    const name = String(formData.get("name") ?? "").trim();
    const categoryId = Number(formData.get("categoryId"));
    if (!name || !categoryId) return { error: "Falta el nombre o la categoría." };
    const pctRaw = String(formData.get("commissionPct") ?? "").trim();
    const values = {
      name,
      categoryId,
      description: String(formData.get("description") ?? "").trim() || null,
      price: toCents(String(formData.get("price") ?? "0")),
      priceFrom: formData.get("priceFrom") === "on",
      durationMin: Math.max(5, Number(formData.get("durationMin")) || 30),
      commissionPct: pctRaw === "" ? null : Math.min(100, Math.max(0, Number(pctRaw))),
      bookable: formData.get("bookable") === "on",
      showOnSite: formData.get("showOnSite") === "on",
      active: formData.get("active") === "on",
    };
    if (id) await db.update(schema.services).set(values).where(eq(schema.services.id, id));
    else await db.insert(schema.services).values(values);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
  revalidatePath("/", "layout");
  redirect("/admin/servicios");
}

export async function deleteService(formData: FormData) {
  await assertOwner();
  await db.delete(schema.services).where(eq(schema.services.id, Number(formData.get("id"))));
  revalidatePath("/", "layout");
  redirect("/admin/servicios");
}

export async function saveCategory(formData: FormData) {
  await assertOwner();
  const id = Number(formData.get("id")) || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const description = String(formData.get("description") ?? "").trim() || null;
  if (id) await db.update(schema.serviceCategories).set({ name, description }).where(eq(schema.serviceCategories.id, id));
  else await db.insert(schema.serviceCategories).values({ name, description, sort: 99 });
  revalidatePath("/", "layout");
}

export async function moveCategory(formData: FormData) {
  await assertOwner();
  const id = Number(formData.get("id"));
  const dir = Number(formData.get("dir"));
  const cats = await db.select().from(schema.serviceCategories).orderBy(schema.serviceCategories.sort, schema.serviceCategories.id);
  const idx = cats.findIndex((c) => c.id === id);
  const swap = cats[idx + dir];
  if (idx < 0 || !swap) return;
  const order = cats.map((c) => c.id);
  [order[idx], order[idx + dir]] = [order[idx + dir], order[idx]];
  await Promise.all(order.map((cid, i) => db.update(schema.serviceCategories).set({ sort: i }).where(eq(schema.serviceCategories.id, cid))));
  revalidatePath("/", "layout");
}
