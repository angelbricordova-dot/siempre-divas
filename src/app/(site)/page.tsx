import Link from "next/link";
import { and, asc, desc, eq, gte, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { Reveal } from "@/components/site/reveal";
import { nextOpenSlot } from "@/lib/booking";
import { listCatalog, listStaff } from "@/lib/data";
import { money } from "@/lib/money";
import { MSG } from "@/lib/messages";
import { prettyPhone, waLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { fullName, positionOf } from "@/lib/staff-name";
import { DAY_NAMES, DAY_SHORT, localDate, prettyTime, relativeDay, shortDate } from "@/lib/time";

export const dynamic = "force-dynamic";

function hoursSummary(hours: ({ open: string; close: string } | null)[]) {
  const open = hours.map((h, i) => ({ h, i })).filter((x) => x.h);
  if (!open.length) return { days: "Con cita", time: "" };
  const order = [1, 2, 3, 4, 5, 6, 0];
  const days = order.filter((d) => hours[d]);
  const label = days.length > 1 ? `${DAY_SHORT[days[0]]} a ${DAY_SHORT[days[days.length - 1]]}` : DAY_NAMES[days[0]];
  const first = hours[days[0]]!;
  return { days: label, time: `${first.open} a ${first.close}` };
}

const FAQ = (policy: string, address: string, city: string, mapsUrl: string) => [
  {
    q: "¿Necesito cita o puedo ir sin reservar?",
    a: "Puedes venir sin cita y te atendemos apenas se libere una profesional. Si reservas, tu turno te espera y no haces fila.",
  },
  {
    q: "¿Cómo puedo pagar?",
    a: "En efectivo, por transferencia, con De Una o con tarjeta. Pagas en caja al terminar tu servicio.",
  },
  {
    q: "¿Por qué algunos precios dicen “desde”?",
    a: "Porque dependen del largo de tu cabello o del diseño que elijas. Antes de empezar te decimos el precio final, sin sorpresas.",
  },
  { q: "¿Qué pasa si no puedo llegar?", a: policy },
  {
    q: "¿Puedo pedir un diseño de uñas que vi en internet?",
    a: "Claro. Mándanos la foto por WhatsApp antes de tu cita y te decimos cuánto tiempo toma y cuánto cuesta.",
  },
  { q: "¿Dónde están?", a: `En ${address}, ${city}.`, link: mapsUrl },
];

export default async function Home() {
  const settings = await getSettings();
  const today = localDate();
  const [catalog, team, promos, photos, next] = await Promise.all([
    listCatalog({ onlyActive: true }),
    listStaff({ includeOwner: true }),
    db
      .select()
      .from(schema.promotions)
      .where(and(eq(schema.promotions.active, true), or(isNull(schema.promotions.validUntil), gte(schema.promotions.validUntil, today))))
      .orderBy(asc(schema.promotions.sort), desc(schema.promotions.createdAt)),
    db
      .select({ id: schema.media.id, alt: schema.media.alt })
      .from(schema.media)
      .where(eq(schema.media.kind, "gallery"))
      .orderBy(asc(schema.media.sort), desc(schema.media.createdAt))
      .limit(24),
    settings.bookingEnabled ? nextOpenSlot(settings) : Promise.resolve(null),
  ]);
  const menu = catalog
    .map((c) => ({ ...c, services: c.services.filter((s) => s.showOnSite) }))
    .filter((c) => c.services.length);
  const allServices = menu.flatMap((c) => c.services);
  // Precio de entrada: el servicio completo más barato (sin contar extras de pocos minutos).
  const base = allServices.filter((s) => s.durationMin >= 20);
  const minPrice = base.length ? Math.min(...base.map((s) => s.price)) : 0;
  const cheapest = base.find((s) => s.price === minPrice);
  const featured = menu.flatMap((c) => c.services.slice(0, 2)).slice(0, 10);
  const people = team.filter((t) => t.showOnSite && t.active);
  const hrs = hoursSummary(settings.hours);
  const wa = settings.whatsapp;
  const igHandle = settings.instagram.replace(/\/$/, "").split("/").pop();
  const ttHandle = settings.tiktok.replace(/\/$/, "").split("/").pop()?.replace("@", "");
  const nextLabel = next ? `${relativeDay(next.date, today)}, ${prettyTime(next.time)}` : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: settings.businessName,
    description: settings.tagline,
    telephone: `+${wa}`,
    address: { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Guayaquil", addressCountry: "EC" },
    sameAs: [settings.instagram, settings.tiktok].filter(Boolean),
    priceRange: "$$",
    openingHoursSpecification: settings.hours
      .map((h, i) => (h ? { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i], opens: h.open, closes: h.close } : null))
      .filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal />

      {/* ── Portada: el nombre como monumento ─────────────────────────── */}
      <header className="relative h-svh min-h-[560px] overflow-hidden">
        <nav className="relative z-10 flex items-start justify-between px-[var(--margin)] pt-[max(env(safe-area-inset-top),20px)]" aria-label="Principal">
          <Link href="/" aria-label="Siempre Divas, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-horizontal-ivory.svg" alt="Siempre Divas" className="h-9 w-auto sm:h-11" />
          </Link>
          <ul className="hidden items-center gap-7 text-[var(--step-body)] md:flex">
            <li><a href="#precios" className="link">Precios</a></li>
            <li><a href="#equipo" className="link">Nosotras</a></li>
            <li><a href="#contacto" className="link">Contacto</a></li>
            <li><Link href="/reservar" className="btn min-h-11">Reservar</Link></li>
          </ul>
          <a href="#precios" className="pt-2 text-[17px] md:hidden">Precios</a>
        </nav>

        <div className="relative z-10 mt-[clamp(48px,10vh,120px)] max-w-[60vw] px-[var(--margin)] md:max-w-[34ch]">
          <p data-rise style={{ "--i": 0 } as React.CSSProperties} className="text-[clamp(22px,1.9vw,30px)] leading-[1.25]">
            Uñas, cabello y belleza en el centro de Guayaquil.
          </p>
          <div data-rise style={{ "--i": 1 } as React.CSSProperties} className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link href="/reservar" className="btn">Reservar cita</Link>
            <a href={waLink(wa, MSG.info)} target="_blank" rel="noreferrer" className="link text-[var(--step-body)]">
              o escríbenos
            </a>
          </div>
          {nextLabel && (
            <p data-rise style={{ "--i": 2 } as React.CSSProperties} className="mt-6 text-[16px] text-[var(--ink-soft)]">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#7fd39b] align-middle" aria-hidden />
              Próximo turno libre:{" "}
              <Link href={`/reservar?d=${next!.date}`} className="link text-[var(--ink)]">
                {nextLabel.toLowerCase()}
              </Link>
            </p>
          )}
        </div>

        <div className="monument-wrap pointer-events-none absolute inset-x-0 top-[76px] bottom-0 select-none md:top-auto" aria-hidden>
          <p className="monument wide absolute bottom-0 -mb-[0.06em] -ml-[0.07em] max-md:hidden">Divas</p>
          <p
            className="wide absolute top-[-0.06em] right-[-0.14em] text-[clamp(120px,42vw,300px)] text-[var(--accent)] md:hidden"
            style={{ writingMode: "vertical-rl" }}
          >
            Divas
          </p>
        </div>
        <h1 className="sr-only">Siempre Divas, salón de belleza en Guayaquil</h1>
      </header>

      {/* ── Datos rápidos ─────────────────────────────────────────────── */}
      <section className="px-[var(--margin)] pt-[clamp(96px,10vw,140px)] pb-[clamp(80px,8vw,120px)]" aria-labelledby="intro-h">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <h2 id="intro-h" data-reveal className="text-[clamp(44px,5vw,76px)] leading-none font-light tracking-[-0.02em] md:col-span-6">
            Siempre lista
          </h2>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="max-w-[34ch] text-[var(--step-body)] md:col-span-4 md:col-start-9">
            Ven sin cita o reserva en línea. Materiales de calidad, precios justos y el trato de siempre.
          </p>
        </div>
        <dl className="mt-[clamp(64px,8vw,120px)] grid grid-cols-2 gap-x-6 gap-y-10 md:flex md:justify-between">
          {[
            [hrs.days, hrs.time ? `de ${hrs.time}` : ""],
            [settings.address, settings.city],
            [minPrice ? `Desde ${money(minPrice)}` : "Precios justos", cheapest ? cheapest.name.toLowerCase() : ""],
            [prettyPhone(wa), "WhatsApp y citas"],
          ].map(([v, note], i) => (
            <div key={v} data-reveal style={{ "--i": i } as React.CSSProperties}>
              <dt className="sr-only">{["Horario", "Dirección", "Precio", "Teléfono"][i]}</dt>
              <dd className="tabular text-[clamp(22px,3vw,44px)] leading-[1.05] font-light tracking-[-0.02em]">{v}</dd>
              <dd className="mt-2 text-[var(--step-small)] text-[var(--ink-soft)]">{note}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Lo que hacemos: los nombres como párrafo ──────────────────── */}
      <section className="bg-[var(--ground-2)] px-[var(--margin)] py-[clamp(96px,10vw,160px)]" aria-label="Servicios">
        <p data-reveal className="max-w-[60ch] text-[clamp(24px,2.5vw,36px)] leading-[1.25] font-normal tracking-[-0.01em] text-[var(--ink-soft)]">
          <span className="text-[var(--ink)]">Lo que hacemos: </span>
          {featured.map((s, i) => (
            <span key={s.id}>
              <Link href={`/reservar?s=${s.id}`} className="name-link transition-colors duration-200">
                {s.name.toLowerCase()}
              </Link>
              {i < featured.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-8 text-[15px] text-[var(--ink-soft)]">
          {allServices.length} servicios en {menu.length} especialidades. Toca uno para reservarlo.
        </p>
      </section>

      {/* ── Precios: la palabra gigante y las barras ───────────────────── */}
      <section id="precios" className="scroll-mt-4 px-[var(--margin)] py-[clamp(96px,10vw,180px)]" aria-labelledby="precios-h">
        <div className="mx-auto max-w-[640px] [container-type:inline-size]">
          <h2 id="precios-h" className="wide text-[16cqw] text-[var(--ink)]" data-reveal>
            Precios
          </h2>
          <div className="mt-5 space-y-1.5">
            {menu.map((c, i) => (
              <details key={c.id} open={i === 0} className="bg-[var(--ground-3)]" data-reveal style={{ "--i": i } as React.CSSProperties}>
                <summary className="flex h-14 items-center justify-between px-[18px] text-[17px] font-medium">
                  {c.name}
                  <span className="plus text-[24px] leading-none font-light" aria-hidden>+</span>
                </summary>
                <ul className="space-y-3.5 px-5 pt-1 pb-5">
                  {c.services.map((s) => (
                    <li key={s.id}>
                      <Link href={`/reservar?s=${s.id}`} className="flex items-baseline justify-between gap-4">
                        <span>
                          <span className="block text-[16px]">{s.name}</span>
                          {s.description && <span className="block text-[14px] text-[var(--ink-soft)]">{s.description}</span>}
                          <span className="block text-[14px] text-[var(--ink-soft)]">{s.durationMin} min</span>
                        </span>
                        <span className="tabular shrink-0 text-[16px]">
                          {s.priceFrom && <span className="text-[14px] text-[var(--ink-soft)]">desde </span>}
                          {money(s.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <p className="mt-6 text-[15px] text-[var(--ink-soft)]">
            Precios en dólares. Los que dicen “desde” dependen del largo o del diseño; te confirmamos el valor antes de empezar.
          </p>
          <Link href="/reservar" className="btn mt-6 w-full sm:w-auto">Reservar ahora</Link>
        </div>
      </section>

      {/* ── Promos (campo dorado) ─────────────────────────────────────── */}
      {promos.length > 0 && (
        <section className="bg-[var(--accent)] px-[var(--margin)] py-[clamp(80px,9vw,140px)] text-[#0e0c0a]" aria-labelledby="promos-h">
          <h2 id="promos-h" data-reveal className="text-[var(--step-head)] leading-[1.02] font-semibold tracking-[-0.02em]">
            Promos de este mes
          </h2>
          <ul className="mt-12 space-y-10">
            {promos.map((p, i) => (
              <li key={p.id} data-reveal style={{ "--i": i } as React.CSSProperties} className="grid gap-5 md:grid-cols-12 md:items-center">
                {p.mediaId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${p.mediaId}`} alt={p.title} loading="lazy" className="aspect-[4/5] w-full object-cover md:col-span-3" />
                )}
                <div className={p.mediaId ? "md:col-span-7 md:col-start-5" : "md:col-span-9"}>
                  <p className="text-[clamp(26px,3vw,44px)] leading-[1.05] font-semibold tracking-[-0.02em]">
                    {p.title} {p.priceText && <span className="tabular whitespace-nowrap">· {p.priceText}</span>}
                  </p>
                  {p.description && <p className="mt-3 max-w-[52ch] text-[var(--step-body)]">{p.description}</p>}
                  <p className="mt-3 text-[15px]">{p.validUntil ? `Válida hasta el ${shortDate(p.validUntil)}.` : "Por tiempo limitado."}</p>
                  <a href={waLink(wa, MSG.promo(p.title))} target="_blank" rel="noreferrer" className="mt-4 inline-block font-semibold underline underline-offset-4">
                    La quiero
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Nosotras ──────────────────────────────────────────────────── */}
      <section id="equipo" className="scroll-mt-4 px-[var(--margin)] py-[clamp(96px,10vw,180px)]" aria-label="Nosotras">
        <div className="grid gap-10 md:grid-cols-[34%_1fr]">
          <dl className="grid grid-cols-2 gap-5 text-[14px] md:order-none md:grid-cols-1 md:content-start" data-reveal>
            <div>
              <dt className="text-[var(--ink-soft)]">Dueña</dt>
              <dd>Minerva</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-soft)]">Dónde</dt>
              <dd>{settings.address}</dd>
            </div>
            <div>
              <dt className="text-[var(--ink-soft)]">Horario</dt>
              <dd>
                {hrs.days} {hrs.time}
              </dd>
            </div>
          </dl>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="max-w-[48ch] text-[clamp(20px,1.7vw,26px)] leading-[1.35] md:-order-none">
            {settings.aboutText}
          </p>
        </div>
        {people.length > 0 && (
          <div className="mt-[clamp(64px,8vw,120px)] grid gap-6 md:grid-cols-[34%_1fr]">
            <p className="text-[14px] text-[var(--ink-soft)] md:text-[var(--ink-soft)]">El equipo</p>
            <ul className="grid gap-x-16 gap-y-3 sm:grid-cols-2">
              {people.map((p, i) => (
                <li key={p.id} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex items-baseline justify-between gap-4 text-[16px]">
                  <span>{fullName(p)}</span>
                  <span className="text-right text-[14px] text-[var(--ink-soft)]">{positionOf(p) ?? ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Trabajos ──────────────────────────────────────────────────── */}
      {photos.length >= 3 ? (
        <section className="flex min-h-[80svh] flex-col justify-center bg-[var(--ground-2)] py-20 md:min-h-svh" aria-labelledby="galeria-h">
          <div className="relative">
            <p id="galeria-h" className="relative z-10 mb-[-12px] px-[var(--margin)] text-[clamp(20px,1.6vw,24px)]">
              Nuestro trabajo <span className="text-[var(--ink-soft)]">({photos.length})</span>
            </p>
            <ul className="strip flex gap-[5vw] overflow-x-auto px-[var(--margin)]">
              {photos.map((p) => (
                <li key={p.id} className="frame aspect-[2/3] w-[34vw] shrink-0 overflow-hidden md:w-[11vw] md:min-w-[150px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${p.id}`} alt={p.alt ?? "Trabajo de Siempre Divas"} loading="lazy" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--ground-2)] px-[var(--margin)] py-[clamp(96px,10vw,160px)]" aria-label="Redes sociales">
          <p data-reveal className="max-w-[30ch] text-[clamp(20px,1.7vw,26px)]">Nuestro trabajo, todos los días en Instagram y TikTok.</p>
          <a data-reveal style={{ "--i": 1 } as React.CSSProperties} href={settings.instagram} target="_blank" rel="noreferrer" className="link mt-6 block text-[clamp(40px,8.5vw,140px)] leading-none font-semibold tracking-[-0.03em] break-all">
            @{igHandle}
          </a>
          {ttHandle && (
            <a data-reveal style={{ "--i": 2 } as React.CSSProperties} href={settings.tiktok} target="_blank" rel="noreferrer" className="link mt-4 block text-[clamp(22px,2.5vw,36px)] text-[var(--ink-soft)]">
              TikTok @{ttHandle}
            </a>
          )}
        </section>
      )}

      {/* ── Preguntas ─────────────────────────────────────────────────── */}
      <section className="px-[var(--margin)] py-[clamp(96px,10vw,180px)]" aria-labelledby="faq-h">
        <h2 id="faq-h" data-reveal className="max-w-[16ch] text-[clamp(40px,5.5vw,84px)] leading-[1.02] font-light tracking-[-0.02em]">
          Lo que nos preguntan
        </h2>
        <div className="mt-20 md:ml-[33.33%]">
          {FAQ(settings.bookingPolicy, settings.address, settings.city, settings.mapsUrl).map((f, i) => (
            <details key={f.q} className="group -mx-[var(--margin)] px-[var(--margin)] open:bg-[var(--ground-3)] md:mx-[-24px] md:px-6" data-reveal style={{ "--i": i } as React.CSSProperties}>
              <summary className="flex items-center justify-between gap-4 py-[14px] text-[clamp(19px,1.6vw,24px)]">
                {f.q}
                <span className="plus shrink-0 text-[26px] leading-none font-light" aria-hidden>+</span>
              </summary>
              <p className="max-w-[48ch] pb-6 text-[16px] md:text-[17px]">
                {f.a}{" "}
                {"link" in f && f.link && (
                  <a href={f.link} target="_blank" rel="noreferrer" className="link text-[var(--accent)]">
                    Ver en el mapa
                  </a>
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Contacto: el WhatsApp como tipografía ─────────────────────── */}
      <section id="contacto" className="relative flex min-h-[86svh] scroll-mt-0 flex-col bg-[var(--ink)] px-[var(--margin)] pt-[clamp(32px,4vw,56px)] pb-8 text-[#0e0c0a] md:min-h-svh" aria-label="Contacto">
        <p className="max-w-[26ch] text-[clamp(18px,1.5vw,22px)]">Escríbenos para precios de diseños, dudas o tu turno de hoy.</p>
        <a
          href={waLink(wa, MSG.hello)}
          target="_blank"
          rel="noreferrer"
          className="tabular mt-auto mb-[8vh] block text-[clamp(52px,11.5vw,190px)] leading-none font-normal tracking-[-0.04em] transition-colors duration-200 hover:text-[#9a7431]"
        >
          {prettyPhone(wa)}
        </a>
        <div className="flex flex-col gap-3 text-[15px] md:flex-row md:justify-between">
          <p>
            {settings.address}, {settings.city} ·{" "}
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Cómo llegar
            </a>
          </p>
          <p className="flex gap-5">
            <a href={settings.instagram} target="_blank" rel="noreferrer" className="underline underline-offset-4">Instagram</a>
            <a href={settings.tiktok} target="_blank" rel="noreferrer" className="underline underline-offset-4">TikTok</a>
            <a href={waLink(wa)} target="_blank" rel="noreferrer" className="underline underline-offset-4">WhatsApp</a>
          </p>
        </div>
      </section>

      {/* ── Pie ───────────────────────────────────────────────────────── */}
      <footer className="grid min-h-[70svh] grid-rows-[auto_1fr_auto] px-[var(--margin)] pt-10 pb-6 md:min-h-svh">
        <div className="grid grid-cols-2 gap-8 text-[15px] md:grid-cols-4">
          <div>
            <p>Dirección</p>
            <p className="text-[var(--ink-soft)]">{settings.address}</p>
            <p className="text-[var(--ink-soft)]">{settings.city}</p>
          </div>
          <div>
            <p>Horario</p>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <p key={d} className="text-[var(--ink-soft)]">
                {DAY_SHORT[d]} {settings.hours[d] ? `${settings.hours[d]!.open}–${settings.hours[d]!.close}` : "cerrado"}
              </p>
            ))}
          </div>
          <div>
            <p>Página</p>
            <p><a href="#precios" className="link text-[var(--ink-soft)]">Precios</a></p>
            <p><Link href="/reservar" className="link text-[var(--ink-soft)]">Reservar</Link></p>
            <p><a href="#equipo" className="link text-[var(--ink-soft)]">Nosotras</a></p>
          </div>
          <div>
            <p>Redes</p>
            <p><a href={settings.instagram} target="_blank" rel="noreferrer" className="link text-[var(--ink-soft)]">Instagram</a></p>
            <p><a href={settings.tiktok} target="_blank" rel="noreferrer" className="link text-[var(--ink-soft)]">TikTok</a></p>
            <p><a href={waLink(wa)} target="_blank" rel="noreferrer" className="link text-[var(--ink-soft)]">WhatsApp</a></p>
          </div>
        </div>
        <div />
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-horizontal-gold.svg" alt="Siempre Divas" className="footer-mark block w-full" />
          <div className="mt-5 flex justify-between text-[13px] text-[var(--ink-soft)]">
            <span>© {today.slice(0, 4)} Siempre Divas · Guayaquil</span>
            <Link href="/admin" className="link">Equipo</Link>
          </div>
        </div>
      </footer>

      {/* Botón fijo de reserva en el celular */}
      <div className="fixed right-4 bottom-[max(env(safe-area-inset-bottom),16px)] z-40 md:hidden">
        {/* taste-skill-ignore: botón flotante real, la sombra lo separa del contenido que pasa debajo */}
        <Link href="/reservar" className="btn shadow-[0_8px_24px_rgba(0,0,0,.45)]" /* taste-skill-ignore */>
          Reservar
        </Link>
      </div>
    </>
  );
}
