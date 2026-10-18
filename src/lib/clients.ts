import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizePhone } from "./phone";

/** Busca la clienta por id o teléfono, o la crea. Devuelve null si no hay nombre. */
export async function resolveClient(input: { id?: number | null; name?: string | null; phone?: string | null }) {
  if (input.id) {
    const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, input.id));
    if (c) return c;
  }
  const name = input.name?.trim();
  const phone = normalizePhone(input.phone);
  if (phone) {
    const [c] = await db.select().from(schema.clients).where(eq(schema.clients.phone, phone));
    if (c) {
      if (name && name !== c.name && c.name.length < 2) {
        await db.update(schema.clients).set({ name }).where(eq(schema.clients.id, c.id));
      }
      return c;
    }
  }
  if (!name) return null;
  const [created] = await db.insert(schema.clients).values({ name, phone }).returning();
  return created;
}
