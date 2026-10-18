/* Crea las tablas (migraciones) y los datos iniciales. Es idempotente: se puede correr siempre. */
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import { DEFAULT_CATALOG, DEFAULT_SETTINGS } from "../lib/defaults";

// Candado de Postgres para que dos servidores no migren a la vez.
const LOCK_ID = 7_212_026;

export async function setupDatabase(url: string, log: (msg: string) => void = () => {}) {
  const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  try {
    await db.execute(sql`select pg_advisory_lock(${LOCK_ID})`);
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    log("✓ Migraciones aplicadas");

    const existing = await db.select({ id: schema.settings.id }).from(schema.settings);
    if (existing.length === 0) {
      await db.insert(schema.settings).values({ id: 1, data: DEFAULT_SETTINGS });
      log("✓ Ajustes iniciales creados");
    }

    const cats = await db.select({ id: schema.serviceCategories.id }).from(schema.serviceCategories);
    if (cats.length === 0) {
      for (const [i, cat] of DEFAULT_CATALOG.entries()) {
        const [row] = await db
          .insert(schema.serviceCategories)
          .values({ name: cat.name, description: cat.description, sort: i })
          .returning();
        await db.insert(schema.services).values(
          cat.services.map((s, j) => ({
            categoryId: row.id,
            name: s.name,
            description: s.description ?? null,
            price: Math.round(s.price * 100),
            priceFrom: s.from ?? false,
            durationMin: s.min,
            sort: j,
          })),
        );
      }
      log("✓ Catálogo de servicios inicial creado");
    }

    const owners = await db.select({ id: schema.staff.id }).from(schema.staff).where(eq(schema.staff.role, "owner"));
    if (owners.length === 0) {
      const password = process.env.ADMIN_PASSWORD;
      if (!password) {
        log("⚠️  Define ADMIN_PASSWORD para crear la cuenta de Minerva (usuario: minerva).");
      } else {
        const allCats = await db.select({ id: schema.serviceCategories.id }).from(schema.serviceCategories);
        await db.insert(schema.staff).values({
          name: "Minerva",
          username: "minerva",
          passwordHash: await bcrypt.hash(password, 10),
          role: "owner",
          position: "Dueña",
          commissionPct: 0,
          color: "#C9A45C",
          specialty: "Dueña",
          categoryIds: allCats.map((c) => c.id),
          sort: 0,
        });
        log("✓ Cuenta de la dueña creada (usuario: minerva)");
      }
    }
  } finally {
    await db.execute(sql`select pg_advisory_unlock(${LOCK_ID})`).catch(() => {});
    await client.end({ timeout: 5 });
  }
}
