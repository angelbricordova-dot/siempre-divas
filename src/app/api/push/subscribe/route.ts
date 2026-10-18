import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  await db
    .insert(schema.pushSubscriptions)
    .values({ staffId: user.id, endpoint: parsed.data.endpoint, keys: parsed.data.keys })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { staffId: user.id, keys: parsed.data.keys },
    });
  return NextResponse.json({ ok: true });
}
