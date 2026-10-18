import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!id) return new Response("No encontrado", { status: 404 });
  const [m] = await db.select().from(schema.media).where(eq(schema.media.id, id));
  if (!m) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
