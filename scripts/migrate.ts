/* Ejecuta las migraciones y crea los datos iniciales. Se corre antes de cada build. */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { DEFAULT_CATALOG, DEFAULT_SETTINGS } from "../src/lib/defaults";

async function main() {
  // Neon recomienda la conexión directa (sin pooler) para migraciones.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠️  DATABASE_URL no está definida: se omiten las migraciones.");
    return;
  }
  const client = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("✓ Migraciones aplicadas");

  const existing = await db.select({ id: schema.settings.id }).from(schema.settings);
  if (existing.length === 0) {
    await db.insert(schema.settings).values({ id: 1, data: DEFAULT_SETTINGS });
    console.log("✓ Ajustes iniciales creados");
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
    console.log("✓ Catálogo de servicios inicial creado");
  }

  const owners = await db.select().from(schema.staff).where(eq(schema.staff.role, "owner"));
  if (owners.length === 0) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.warn("⚠️  Define ADMIN_PASSWORD para crear la cuenta de Minerva (usuario: minerva).");
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
      console.log("✓ Cuenta de la dueña creada (usuario: minerva)");
    }
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
