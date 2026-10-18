import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/** Diagnóstico de la instalación. No muestra claves ni datos privados. */
export async function GET() {
  const checks: Record<string, string> = {};
  const ok = (k: string, v: string) => (checks[k] = `✅ ${v}`);
  const bad = (k: string, v: string) => (checks[k] = `❌ ${v}`);

  if (process.env.DATABASE_URL) ok("DATABASE_URL", "configurada");
  else bad("DATABASE_URL", "falta. En Vercel: Storage → conecta Neon (marca Production y Preview) y vuelve a desplegar.");

  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) ok("AUTH_SECRET", "configurada");
  else bad("AUTH_SECRET", "falta o es muy corta (mínimo 16 caracteres). Agrégala en Settings → Environment Variables.");

  if (process.env.ADMIN_PASSWORD) ok("ADMIN_PASSWORD", "configurada");
  else checks.ADMIN_PASSWORD = "⚠️ no está; solo hace falta para crear la cuenta de Minerva la primera vez.";

  if (process.env.DATABASE_URL) {
    try {
      await ensureDatabase();
      ok("base_de_datos", "conectada y con las tablas creadas");
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.services);
      ok("servicios", `${n} en el catálogo`);
      const owners = await db.select({ u: schema.staff.username }).from(schema.staff).where(eq(schema.staff.role, "owner"));
      if (owners.length) ok("cuenta_duena", `existe (usuario: ${owners[0].u ?? "sin usuario"})`);
      else bad("cuenta_duena", "no existe todavía. Define ADMIN_PASSWORD y vuelve a abrir esta página.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      bad("base_de_datos", `no se pudo usar: ${msg.replace(/postgres(ql)?:\/\/[^\s]+/gi, "[url]").slice(0, 300)}`);
    }
  }

  const healthy = !Object.values(checks).some((v) => v.startsWith("❌"));
  return NextResponse.json({ estado: healthy ? "todo bien" : "falta configurar algo", checks }, { status: healthy ? 200 : 500 });
}
