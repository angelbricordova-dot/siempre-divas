import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

/** Diagnóstico de la instalación. No muestra claves ni datos privados. */
export async function GET(req: NextRequest) {
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
  const estado = healthy ? "todo bien" : "falta configurar algo";

  // En el navegador se muestra como página legible; para otros clientes, JSON.
  if (!req.headers.get("accept")?.includes("text/html")) {
    return NextResponse.json({ estado, checks }, { status: healthy ? 200 : 500 });
  }
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const rows = Object.entries(checks)
    .map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`)
    .join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Estado · Siempre Divas</title>
<style>body{font-family:system-ui,sans-serif;background:#fff;color:#1f1b16;margin:0;padding:28px 20px;line-height:1.5}h1{font-weight:400;font-size:28px;margin:0 0 6px}p{color:#6e6458;margin:0 0 22px}ul{list-style:none;padding:0;margin:0;display:grid;gap:10px}li{background:#fbf8f2;border-radius:16px;padding:14px 16px;display:grid;gap:4px}b{font-size:14px;color:#8c6a2e;font-weight:600}span{font-size:16px}</style></head>
<body><h1>${healthy ? "Todo listo ✅" : "Falta configurar algo"}</h1><p>Diagnóstico de la instalación de Siempre Divas.</p><ul>${rows}</ul></body></html>`;
  return new NextResponse(html, { status: healthy ? 200 : 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
