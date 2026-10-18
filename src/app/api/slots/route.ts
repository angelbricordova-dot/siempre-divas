import { NextResponse, type NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSlots } from "@/lib/booking";
import { getSettings } from "@/lib/settings";
import { addDays, localDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const date = sp.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  const serviceIds = (sp.get("services") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 10);
  const staffId = Number(sp.get("staff")) || null;
  const ignore = Number(sp.get("ignore")) || undefined;
  const settings = await getSettings();
  const admin = sp.get("admin") === "1";
  if (!admin) {
    const today = localDate();
    if (date < today || date > addDays(today, settings.maxDaysAhead)) return NextResponse.json({ slots: [] });
  }
  const svcs = serviceIds.length
    ? await db.select().from(schema.services).where(inArray(schema.services.id, serviceIds))
    : [];
  const duration = Math.max(15, svcs.reduce((a, s) => a + s.durationMin, 0) || 30);
  const categoryIds = [...new Set(svcs.map((s) => s.categoryId))];
  const slots = await getSlots({
    settings: admin ? { ...settings, minNoticeMinutes: 0 } : settings,
    date,
    durationMin: duration,
    categoryIds,
    staffId,
    ignoreAppointmentId: ignore,
  });
  return NextResponse.json({ slots, duration }, { headers: { "Cache-Control": "no-store" } });
}
