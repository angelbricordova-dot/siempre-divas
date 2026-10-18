import "server-only";
import { setupDatabase } from "@/db/setup";

let ready: Promise<void> | null = null;

/**
 * Se asegura una vez por servidor de que las tablas y los datos iniciales existan.
 * Así la app funciona aunque el build se haya hecho sin base de datos.
 */
export function ensureDatabase(): Promise<void> {
  if (!ready) {
    const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
    if (!url) {
      return Promise.reject(new Error("Falta la variable de entorno DATABASE_URL"));
    }
    ready = setupDatabase(url, (m) => console.log(m)).catch((err) => {
      ready = null; // se reintenta en la próxima visita
      throw err;
    });
  }
  return ready;
}
