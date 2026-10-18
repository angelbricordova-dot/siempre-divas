"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { assertOwner } from "@/lib/auth";

const MAX_BYTES = 2_500_000;

async function storeImage(file: File, kind: "gallery" | "promo", alt: string | null) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  if (file.size > MAX_BYTES) throw new Error("La imagen es muy pesada (máximo 2,5 MB).");
  const buf = Buffer.from(await file.arrayBuffer());
  const [m] = await db.insert(schema.media).values({ kind, mime: file.type, data: buf, alt }).returning({ id: schema.media.id });
  return m.id;
}

export async function uploadGallery(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (!files.length) return { error: "Elige al menos una foto." };
    const alt = String(formData.get("alt") ?? "").trim() || null;
    for (const f of files) await storeImage(f, "gallery", alt);
    revalidatePath("/", "layout");
    return { ok: files.length === 1 ? "Foto agregada." : `${files.length} fotos agregadas.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir" };
  }
}

export async function deleteMedia(formData: FormData) {
  await assertOwner();
  await db.delete(schema.media).where(eq(schema.media.id, Number(formData.get("id"))));
  revalidatePath("/", "layout");
}

export async function savePromo(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const id = Number(formData.get("id")) || null;
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { error: "Escribe el título de la promo." };
    const file = formData.get("file");
    let mediaId: number | undefined;
    if (file instanceof File && file.size > 0) mediaId = await storeImage(file, "promo", title);
    const values = {
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      priceText: String(formData.get("priceText") ?? "").trim() || null,
      validUntil: String(formData.get("validUntil") ?? "") || null,
      active: formData.get("active") === "on",
      ...(mediaId ? { mediaId } : {}),
    };
    if (id) await db.update(schema.promotions).set(values).where(eq(schema.promotions.id, id));
    else await db.insert(schema.promotions).values(values);
    revalidatePath("/", "layout");
    return { ok: "Promo guardada." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function deletePromo(formData: FormData) {
  await assertOwner();
  await db.delete(schema.promotions).where(eq(schema.promotions.id, Number(formData.get("id"))));
  revalidatePath("/", "layout");
}
