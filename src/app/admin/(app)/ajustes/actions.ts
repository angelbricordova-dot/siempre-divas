"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import type { DayHours } from "@/db/schema";
import { assertOwner, assertUser } from "@/lib/auth";
import { sendWhatsAppToOwner } from "@/lib/notify";
import { normalizePhone } from "@/lib/phone";
import { saveSettings } from "@/lib/settings";

export async function saveBusiness(_: unknown, fd: FormData) {
  try {
    await assertOwner();
    const s = (k: string) => String(fd.get(k) ?? "").trim();
    const hours: DayHours[] = Array.from({ length: 7 }, (_, i) =>
      fd.get(`open_${i}`) === "on" && s(`from_${i}`) && s(`to_${i}`) ? { open: s(`from_${i}`), close: s(`to_${i}`) } : null,
    );
    await saveSettings({
      businessName: s("businessName") || "Siempre Divas",
      tagline: s("tagline"),
      address: s("address"),
      city: s("city"),
      mapsUrl: s("mapsUrl"),
      whatsapp: normalizePhone(s("whatsapp")) ?? "",
      instagram: s("instagram"),
      tiktok: s("tiktok"),
      aboutText: s("aboutText"),
      hours,
      slotMinutes: Math.max(10, Number(s("slotMinutes")) || 30),
      minNoticeMinutes: Math.max(0, Number(s("minNoticeMinutes")) || 0),
      maxDaysAhead: Math.max(1, Number(s("maxDaysAhead")) || 30),
      bookingEnabled: fd.get("bookingEnabled") === "on",
      bookingPolicy: s("bookingPolicy"),
      weekStartsOn: Number(s("weekStartsOn")) || 0,
    });
    revalidatePath("/", "layout");
    return { ok: "Ajustes guardados." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function saveNotifications(_: unknown, fd: FormData) {
  try {
    await assertOwner();
    const phone = normalizePhone(String(fd.get("ownerWhatsapp") ?? "")) ?? "";
    const apikey = String(fd.get("callmebotApiKey") ?? "").trim();
    await saveSettings({ ownerWhatsapp: phone, callmebotApiKey: apikey });
    if (fd.get("test") === "1") {
      const r = await sendWhatsAppToOwner("✅ Siempre Divas: los avisos de citas por WhatsApp están funcionando.", { phone, apikey });
      return r.ok ? { ok: "Mensaje de prueba enviado. Revisa tu WhatsApp." } : { error: `No se pudo enviar: ${r.reason ?? "revisa el número y la clave"}` };
    }
    return { ok: "Guardado." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
}

export async function changePassword(_: unknown, fd: FormData) {
  try {
    const user = await assertUser();
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    if (next.length < 6) return { error: "La nueva clave debe tener al menos 6 caracteres." };
    const [row] = await db.select().from(schema.staff).where(eq(schema.staff.id, user.id));
    if (!row?.passwordHash || !(await bcrypt.compare(current, row.passwordHash))) return { error: "La clave actual no es correcta." };
    await db.update(schema.staff).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(schema.staff.id, user.id));
    return { ok: "Clave cambiada." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo cambiar" };
  }
}
