import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton, SubmitButton } from "@/components/admin/client-ui";
import { Empty, PageHeader, Pill, Section, cx } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { listCatalog, listStaff, listWorks } from "@/lib/data";
import { fullName } from "@/lib/staff-name";
import { localDate, shortDate } from "@/lib/time";
import { deleteMedia, deletePromo, updateWork } from "./actions";
import { GalleryUpload, PromoForm } from "./forms";

export const metadata = { title: "Trabajos y promos" };

export default async function WebPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const filter = Number(sp.c) || null;
  const [promos, works, catalog, staff] = await Promise.all([
    db.select().from(schema.promotions).orderBy(desc(schema.promotions.createdAt)),
    listWorks(500),
    listCatalog(),
    listStaff({ includeOwner: true }),
  ]);
  const categories = catalog.map((c) => ({ id: c.id, name: c.name }));
  const people = staff.map((s) => ({ id: s.id, name: fullName(s) }));
  const shown = filter ? works.filter((w) => w.categoryId === filter) : works;
  const today = localDate();
  const selectClass = "h-10 w-full rounded-lg bg-surface-2 px-2 text-[14px]";

  return (
    <>
      <PageHeader title="Trabajos y promos" back="/admin/mas" subtitle="Lo que subas aquí sale en la página web al instante." />

      <Section title="Subir trabajos">
        <div className="rounded-2xl bg-surface p-4">
          <GalleryUpload categories={categories} staff={people} />
        </div>
      </Section>

      <Section title={`Galería (${works.length})`} className="mt-8">
        {works.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {[{ id: 0, name: "Todos" }, ...categories].map((c) => (
              <a
                key={c.id}
                href={c.id ? `/admin/web?c=${c.id}` : "/admin/web"}
                className={cx("press h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-9 font-medium", (filter ?? 0) === c.id ? "bg-gold text-on-gold" : "bg-surface")}
              >
                {c.name} {c.id ? `(${works.filter((w) => w.categoryId === c.id).length})` : ""}
              </a>
            ))}
          </div>
        )}
        {shown.length === 0 ? (
          <Empty title="Todavía no hay fotos aquí">Sube fotos de tus cortes, colores y diseños: son lo primero que miran las clientas.</Empty>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shown.map((w) => (
              <li key={w.id} className="overflow-hidden rounded-2xl bg-surface">
                <div className="relative aspect-[4/5] bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${w.id}`} alt={w.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
                  {w.featured && (
                    <span className="absolute top-2 left-2">
                      <Pill tone="gold">Destacada</Pill>
                    </span>
                  )}
                </div>
                <details>
                  <summary className="cursor-pointer px-3 py-2.5 text-[14px]">
                    <span className="block truncate font-medium">{categories.find((c) => c.id === w.categoryId)?.name ?? "Sin tipo"}</span>
                    <span className="block truncate text-muted">{w.alt || "Toca para editar"}</span>
                  </summary>
                  <form action={updateWork} className="space-y-1.5 px-3 pb-3">
                    <input type="hidden" name="id" value={w.id} />
                    <input name="alt" defaultValue={w.alt ?? ""} placeholder="Descripción" className={selectClass} />
                    <select name="categoryId" defaultValue={w.categoryId ?? ""} className={selectClass} aria-label="Tipo">
                      <option value="">Sin tipo</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select name="staffId" defaultValue={w.staffId ?? ""} className={selectClass} aria-label="Quién lo hizo">
                      <option value="">Sin nombre</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center justify-between py-1 text-[14px]">
                      Destacada
                      <input type="checkbox" name="featured" defaultChecked={w.featured} className="h-5 w-5 accent-[var(--gold)]" />
                    </label>
                    <SubmitButton size="sm">Guardar</SubmitButton>
                  </form>
                  <form action={deleteMedia} className="px-3 pb-3">
                    <input type="hidden" name="id" value={w.id} />
                    <ConfirmButton message="¿Quitar esta foto de la web?" className="press h-9 w-full text-[14px] font-medium text-bad">
                      Quitar foto
                    </ConfirmButton>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Promociones" className="mt-8">
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
    </>
  );
}
