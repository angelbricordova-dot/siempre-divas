import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
  // prepare: false para funcionar con los poolers de Neon/Supabase.
  return postgres(url, { prepare: false, max: process.env.NODE_ENV === "production" ? 3 : 5 });
}

const client = globalForDb.pg ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
