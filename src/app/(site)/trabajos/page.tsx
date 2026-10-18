import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/site/reveal";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { WorkGallery } from "@/components/site/work-gallery";
import { listCatalog, listWorks } from "@/lib/data";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Trabajos",
  description: "Cortes, color, uñas, cejas y maquillaje hechos en Siempre Divas, Guayaquil.",
};

export default async function TrabajosPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const sp = await searchParams;
  const [settings, works, catalog] = await Promise.all([getSettings(), listWorks(500), listCatalog()]);
  const igHandle = settings.instagram.replace(/\/$/, "").split("/").pop();
  return (
    <>
      <Reveal />
      <SiteHeader />
      <main className="px-[var(--margin)] pt-8 pb-[clamp(72px,9vw,128px)]">
        <h1 data-rise className="display text-[clamp(46px,7vw,96px)]">
          Nuestros <em className="gold">trabajos</em>
        </h1>
        <p data-rise style={{ "--i": 1 } as React.CSSProperties} className="mt-4 max-w-[46ch] text-[clamp(18px,1.4vw,21px)] text-[var(--ink-soft)]">
          Cada foto es de una clienta real del salón. Toca una para verla en grande y reservar ese estilo.
        </p>
        <div className="mt-10">
          {works.length > 0 ? (
            <WorkGallery works={works} categories={catalog.map((c) => ({ id: c.id, name: c.name }))} initialCategory={Number(sp.c) || null} />
          ) : (
            <div className="rounded-3xl bg-[var(--ground-3)] px-6 py-14 text-center">
              <p className="display text-[clamp(28px,3vw,40px)]">Muy pronto, aquí</p>
              <p className="mx-auto mt-3 max-w-[40ch] text-[var(--ink-soft)]">Mientras tanto, mira lo que hacemos en Instagram.</p>
              <a href={settings.instagram} target="_blank" rel="noreferrer" className="btn mt-6">
                @{igHandle}
              </a>
            </div>
          )}
        </div>
        <div className="mt-14 rounded-3xl bg-[var(--ground-2)] p-8 text-center">
          <p className="display text-[clamp(28px,3vw,40px)]">¿Te gustó alguno?</p>
          <Link href="/reservar" className="btn mt-5">
            Reservar mi cita
          </Link>
        </div>
      </main>
      <SiteFooter settings={settings} />
    </>
  );
}
