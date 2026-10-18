import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { Empty, PageHeader, Pill, Section } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { localDate, shortDate } from "@/lib/time";
import { deleteMedia, deletePromo } from "./actions";
import { GalleryUpload, PromoForm } from "./forms";

export const metadata = { title: "Promos y galería" };

export default async function WebPage() {
  await requireOwner();
  const promos = await db.select().from(schema.promotions).orderBy(desc(schema.promotions.createdAt));
  const photos = await db
    .select({ id: schema.media.id, alt: schema.media.alt })
    .from(schema.media)
    .where(eq(schema.media.kind, "gallery"))
    .orderBy(asc(schema.media.sort), desc(schema.media.createdAt));
  const today = localDate();
  return (
    <>
      <PageHeader title="Promos y galería" back="/admin/mas" subtitle="Lo que publiques aquí sale en la página web." />
      <Section title="Promociones">
        <div className="space-y-2">
          {promos.length === 0 && <Empty title="Sin promos activas">Crea una abajo, como las que publicas en Instagram.</Empty>}
          {promos.map((p) => {
            const expired = p.validUntil && p.validUntil < today;
            return (
              <details key={p.id} className="rounded-2xl bg-surface">
                <summary className="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <span className="flex-1 text-[16px] font-medium">{p.title}</span>
                  {p.priceText && <span className="tabular text-[15px] font-semibold">{p.priceText}</span>}
                  {!p.active ? <Pill>Oculta</Pill> : expired ? <Pill tone="bad">Vencida</Pill> : <Pill tone="ok">{p.validUntil ? `Hasta ${shortDate(p.validUntil)}` : "Activa"}</Pill>}
                </summary>
                <div className="px-4 pb-4">
                  <PromoForm promo={p} />
                  <form action={deletePromo} className="mt-2">
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message="¿Borrar esta promo?" className="press h-10 w-full text-[15px] font-medium text-bad">
                      Borrar promo
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            );
          })}
          <details className="rounded-2xl bg-gold-soft">
            <summary className="cursor-pointer px-4 py-3.5 text-[16px] font-semibold text-gold">+ Nueva promo</summary>
            <div className="px-4 pb-4">
              <PromoForm />
            </div>
          </details>
        </div>
      </Section>

      <Section title={`Galería (${photos.length})`} className="mt-8">
        <div className="rounded-2xl bg-surface p-4">
          <GalleryUpload />
        </div>
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-1.5">
            {photos.map((p) => (
              <li key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/media/${p.id}`} alt={p.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
                <form action={deleteMedia} className="absolute top-1 right-1">
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton message="¿Quitar esta foto de la web?" className="press h-8 w-8 rounded-full bg-black/60 text-[14px] text-white">
                    ✕
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
