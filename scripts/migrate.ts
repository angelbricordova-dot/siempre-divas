/* Ejecuta las migraciones y crea los datos iniciales. Se corre antes de cada build
   (y la app lo repite sola al arrancar si la base de datos está vacía). */
import { setupDatabase } from "../src/db/setup";

async function main() {
  // Neon recomienda la conexión directa (sin pooler) para migraciones.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.warn("⚠️  DATABASE_URL no está definida: se omiten las migraciones.");
    return;
  }
  await setupDatabase(url, console.log);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
