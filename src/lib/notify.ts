import "server-only";
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "./settings";
import { normalizePhone } from "./phone";

/** Envía un WhatsApp al número personal de la dueña usando CallMeBot (gratis). */
export async function sendWhatsAppToOwner(text: string, override?: { phone: string; apikey: string }) {
  const settings = await getSettings();
  const phone = normalizePhone(override?.phone ?? settings.ownerWhatsapp);
  const apikey = override?.apikey ?? (settings.callmebotApiKey || process.env.CALLMEBOT_APIKEY || "");
  if (!phone || !apikey) return { ok: false, reason: "WhatsApp automático no configurado" };
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const body = await res.text();
    const ok = res.ok && !/error|invalid/i.test(body.slice(0, 300));
    return { ok, reason: ok ? undefined : body.replace(/<[^>]+>/g, " ").trim().slice(0, 200) };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "Error de red" };
  }
}

function pushReady() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@siempredivas.ec", pub, priv);
  return true;
}

/** Notificación push a la app instalada en el celular. */
export async function sendPush(staffIds: number[], payload: { title: string; body: string; url?: string }) {
  if (!pushReady() || staffIds.length === 0) return;
  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.staffId, staffIds));
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), {
          TTL: 60 * 60,
        });
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
        }
      }
    }),
  );
}

export async function ownerIds() {
  const rows = await db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(eq(schema.staff.role, "owner"));
  return rows.map((r) => r.id);
}

/** Avisa a la dueña por todos los canales disponibles. Nunca lanza error. */
export async function notifyOwner(payload: { title: string; body: string; url?: string; whatsapp?: string }) {
  try {
    await Promise.all([
      sendWhatsAppToOwner(payload.whatsapp ?? `${payload.title}\n${payload.body}`),
      ownerIds().then((ids) => sendPush(ids, payload)),
    ]);
  } catch (err) {
    console.error("notifyOwner", err);
  }
}
