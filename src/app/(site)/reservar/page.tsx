import type { Metadata } from "next";
import Link from "next/link";
import { BookingFlow } from "@/components/site/booking-flow";
import { listCatalog, listStaff } from "@/lib/data";
import { MSG } from "@/lib/messages";
import { prettyPhone, waLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { positionOf } from "@/lib/staff-name";
import { localDate } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reservar cita",
  description: "Elige tu servicio, el día y la hora. Te confirmamos por WhatsApp.",
};

export default async function ReservarPage({ searchParams }: { searchParams: Promise<{ s?: string; d?: string; cat?: string }> }) {
  const sp = await searchParams;
  const [settings, catalog, staff] = await Promise.all([getSettings(), listCatalog({ onlyActive: true }), listStaff({ includeOwner: true })]);
  const menu = catalog
    .map((c) => ({
      id: c.id,
      name: c.name,
      services: c.services
        .filter((s) => s.bookable && s.showOnSite)
        .map((s) => ({ id: s.id, name: s.name, price: s.price, priceFrom: s.priceFrom, durationMin: s.durationMin, categoryId: s.categoryId })),
    }))
    .filter((c) => c.services.length);
  const people = staff
    .filter((s) => s.bookable && s.showOnSite)
    .map((s) => ({ id: s.id, name: s.name, specialty: [positionOf(s), s.position ? s.specialty : null].filter(Boolean).join(" · ") || null, categoryIds: s.categoryIds, daysOff: s.daysOff }));
  const today = localDate();

  return (
    <main>
      <header className="flex items-center justify-between px-[var(--margin)] pt-[max(env(safe-area-inset-top),16px)] pb-2">
        <Link href="/" aria-label="Volver al inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-horizontal-deep.svg" alt="Siempre Divas" className="h-9 w-auto" />
        </Link>
        <a href={waLink(settings.whatsapp)} target="_blank" rel="noreferrer" className="link tabular text-[16px]">
          {prettyPhone(settings.whatsapp)}
        </a>
      </header>
      <div className="px-[var(--margin)] pt-10 pb-10">
        <h1 className="display text-[clamp(46px,7vw,96px)]">
          Reserva tu <em className="gold">cita</em>
        </h1>
        <p className="mt-4 max-w-[40ch] text-[clamp(18px,1.4vw,21px)] text-[var(--ink-soft)]">
          Elige el servicio, el día y la hora. Minerva te confirma por WhatsApp.
        </p>
      </div>
      {settings.bookingEnabled ? (
        <BookingFlow
          catalog={menu}
          people={people}
          hours={settings.hours}
          maxDaysAhead={settings.maxDaysAhead}
          today={today}
          policy={settings.bookingPolicy}
          whatsapp={settings.whatsapp}
          initialService={Number(sp.s) || undefined}
          initialCategory={Number(sp.cat) || undefined}
          initialDate={sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : undefined}
        />
      ) : (
        <div className="px-[var(--margin)] pb-24">
          <p className="text-[20px]">Por ahora agendamos solo por WhatsApp.</p>
          <a href={waLink(settings.whatsapp, MSG.book)} className="btn mt-6" target="_blank" rel="noreferrer">
            Escribir por WhatsApp
          </a>
        </div>
      )}
    </main>
  );
}
