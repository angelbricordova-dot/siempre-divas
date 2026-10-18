import Link from "next/link";
import { Chevron, PageHeader, Pill, Section, buttonClass, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/admin/client-ui";
import { requireOwner } from "@/lib/auth";
import { listCatalog } from "@/lib/data";
import { money } from "@/lib/money";
import { moveCategory, saveCategory } from "./actions";

export const metadata = { title: "Servicios y precios" };

export default async function ServiciosPage() {
  await requireOwner();
  const catalog = await listCatalog();
  return (
    <>
      <PageHeader title="Servicios y precios" back="/admin/mas" subtitle="Los cambios se ven al instante en la web." />
      <div className="space-y-6">
        {catalog.map((c, i) => (
          <Section
            key={c.id}
            title={c.name}
            action={
              <span className="flex items-center gap-1">
                {i > 0 && (
                  <form action={moveCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="dir" value={-1} />
                    <button className="press h-9 w-9 rounded-lg bg-surface text-muted" aria-label="Subir">↑</button>
                  </form>
                )}
                <Link href={`/admin/servicios/nuevo?cat=${c.id}`} className="press h-9 rounded-lg px-2 text-[15px] leading-9 font-semibold text-gold">
                  + Agregar
                </Link>
              </span>
            }
          >
            <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
              {c.services.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/servicios/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px]">{s.name}</p>
                      <p className="text-[13px] text-muted">
                        {s.durationMin} min
                        {s.commissionPct != null ? ` · ${s.commissionPct}% fijo` : ""}
                      </p>
                    </div>
                    {!s.active && <Pill tone="bad">Apagado</Pill>}
                    {s.active && !s.showOnSite && <Pill>Oculto en web</Pill>}
                    <span className="tabular text-[16px] font-semibold">
                      {s.priceFrom ? <span className="text-[13px] font-normal text-muted">desde </span> : null}
                      {money(s.price)}
                    </span>
                    <Chevron />
                  </Link>
                </li>
              ))}
            </ul>
            <details className="mt-2">
              <summary className="cursor-pointer px-1 text-[14px] text-muted">Editar categoría</summary>
              <form action={saveCategory} className="mt-2 grid gap-2 rounded-2xl bg-surface p-3">
                <input type="hidden" name="id" value={c.id} />
                <input name="name" defaultValue={c.name} className={inputClass} aria-label="Nombre de la categoría" />
                <input name="description" defaultValue={c.description ?? ""} placeholder="Descripción corta" className={inputClass} />
                <SubmitButton size="md">Guardar categoría</SubmitButton>
              </form>
            </details>
          </Section>
        ))}
        <Section title="Nueva categoría">
          <form action={saveCategory} className="grid grid-cols-[1fr_auto] gap-2">
            <input name="name" placeholder="Ej: Spa de pies" className={inputClass} required />
            <button className={buttonClass("secondary", "md")}>Crear</button>
          </form>
        </Section>
      </div>
    </>
  );
}
