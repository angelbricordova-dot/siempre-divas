import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Settings } from "@/db/schema";
import { DEFAULT_SETTINGS } from "./defaults";

export async function getSettings(): Promise<Settings> {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
  return { ...DEFAULT_SETTINGS, ...(row?.data ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  const data = { ...current, ...patch };
  await db
    .insert(schema.settings)
    .values({ id: 1, data })
    .onConflictDoUpdate({ target: schema.settings.id, set: { data, updatedAt: new Date() } });
  return data;
}
