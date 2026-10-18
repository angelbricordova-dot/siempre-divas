import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres>; db?: Db };

function getDb(): Db {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. En Vercel: Storage → conecta la base de datos Neon al proyecto (marca Production y Preview).",
    );
  }
  // prepare: false para funcionar con los poolers de Neon/Supabase.
  const client = globalForDb.pg ?? postgres(url, { prepare: false, max: process.env.NODE_ENV === "production" ? 3 : 5 });
  globalForDb.pg = client;
  globalForDb.db = drizzle(client, { schema });
  return globalForDb.db;
}

// La conexión se abre recién en la primera consulta, no al importar el módulo:
// así el build de Vercel no depende de la base de datos.
export const db = new Proxy({} as Db, {
  get(_, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
