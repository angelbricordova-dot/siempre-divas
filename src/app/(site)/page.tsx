import Link from "next/link";
import { and, asc, desc, eq, gte, isNull, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { OpenHashDetails } from "@/components/site/open-hash";
import { Reveal } from "@/components/site/reveal";
import { SiteFooter, SiteHeader } from "@/components/site/chrome";
import { WorkGallery } from "@/components/site/work-gallery";
import { nextOpenSlot } from "@/lib/booking";
import { listCatalog, listStaff, listWorks } from "@/lib/data";
import { MSG } from "@/lib/messages";
import { money } from "@/lib/money";
import { prettyPhone, waLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { fullName, positionOf } from "@/lib/staff-name";
import { DAY_NAMES, localDate, prettyTime, relativeDay, shortDate } from "@/lib/time";

export const dynamic = "force-dynamic";

function hoursSummary(hours: ({ open: string; close: string } | null)[]) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const days = order.filter((d) => hours[d]);
  if (!days.length) return { days: "Con cita", time: "" };
  const label = days.length > 1 ? `${DAY_NAMES[days[0]]} a ${DAY_NAMES[days[days.length - 1]].toLowerCase()}` : DAY_NAMES[days[0]];
  const first = hours[days[0]]!;
  return { days: label, time: `${first.open} a ${first.close}` };
}

const faq = (policy: string, address: string, city: string) => [
  {
    q: "¿Necesito cita o puedo ir sin reservar?",
    a: "Puedes venir sin cita y te atendemos apenas se libere una profesional. Si reservas, tu turno te espera y no haces fila.",
  },
  { q: "¿Cómo puedo pagar?", a: "En efectivo, por transferencia, con De Una o con tarjeta. Pagas en caja al terminar tu servicio." },
  {
    q: "¿Por qué algunos precios dicen “desde”?",
    a: "Porque dependen del largo de tu cabello o del diseño que elijas. Antes de empezar te decimos el precio final, sin sorpresas.",
  },
  { q: "¿Qué pasa si no puedo llegar?", a: policy },
  {
    q: "¿Puedo llevar una foto del corte o diseño que quiero?",
    a: "Claro. Mándanos la foto por WhatsApp antes de tu cita y te decimos cuánto tiempo toma y cuánto cuesta.",
  },
  { q: "¿Dónde están?", a: `En ${address}, ${city}.` },
];

export default async function Home() {
  const settings = await getSettings();
  const today = localDate();
  const [catalog, team, promos, works, next] = await Promise.all([
    listCatalog({ onlyActive: true }),
    listStaff({ includeOwner: true }),
    db
      .select()
      .from(schema.promotions)
      .where(and(eq(schema.promotions.active, true), or(isNull(schema.promotions.validUntil), gte(schema.promotions.validUntil, today))))
      .orderBy(asc(schema.promotions.sort), desc(schema.promotions.createdAt)),
    listWorks(),
    settings.bookingEnabled ? nextOpenSlot(settings) : Promise.resolve(null),
  ]);
  const menu = catalog
    .map((c) => ({ ...c, services: c.services.filter((s) => s.showOnSite) }))
    .filter((c) => c.services.length);
  const people = team.filter((t) => t.showOnSite && t.active);
  const hrs = hoursSummary(settings.hours);
  const wa = settings.whatsapp;
  const igHandle = settings.instagram.replace(/\/$/, "").split("/").pop();
  const heroWorks = works.slice(0, 3);
  const categories = catalog.map((c) => ({ id: c.id, name: c.name }));

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
      .map((h, i) =>
        h
          ? {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i],
              opens: h.open,
              closes: h.close,
            }
          : null,
      )
      .filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal />
      <OpenHashDetails />
      <SiteHeader />

      <main>
        {/* ── Portada ─────────────────────────────────────────────────── */}
        <section className="grid items-center gap-10 px-[var(--margin)] pt-6 pb-16 md:grid-cols-12 md:pt-10 md:pb-24">
          <div className="md:col-span-6">
            <h1 data-rise className="display text-[clamp(44px,6vw,88px)] leading-[1.02]">
              Siempre lista,
              <br />
              <em className="gold">siempre diva.</em>
            </h1>
            <p data-rise style={{ "--i": 1 } as React.CSSProperties} className="mt-6 max-w-[34ch] text-[clamp(18px,1.4vw,21px)] text-[var(--ink-soft)]">
              Cortes, color, uñas y maquillaje en el centro de Guayaquil. Reserva en un minuto y te confirmamos por WhatsApp.
            </p>
            <div data-rise style={{ "--i": 2 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-3">
              <Link href="/reservar" className="btn">
                Reservar cita
              </Link>
              <Link href="/trabajos" className="btn btn-soft">
                Ver trabajos
              </Link>
            </div>
            {next && (
              <p data-rise style={{ "--i": 3 } as React.CSSProperties} className="mt-6 text-[16px] text-[var(--ink-soft)]">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#3fae6a] align-middle" aria-hidden />
                Próximo turno libre:{" "}
                <Link href={`/reservar?d=${next.date}`} className="link font-medium text-[var(--ink)]">
                  {relativeDay(next.date, today).toLowerCase()}, {prettyTime(next.time)}
                </Link>
              </p>
            )}
          </div>

          <div className="hero-art md:col-span-6">
            {heroWorks.length >= 1 ? (
              <div className="relative">
                <Link href="/trabajos" className="work block aspect-[4/5] overflow-hidden rounded-[28px] bg-[var(--ground-3)] md:ml-[12%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${heroWorks[0].id}`} alt={heroWorks[0].alt ?? "Trabajo de Siempre Divas"} className="h-full w-full object-cover" />
                </Link>
                {heroWorks[1] && (
                  <Link
                    href="/trabajos"
                    className="work absolute -bottom-6 -left-2 block aspect-square w-[40%] overflow-hidden rounded-[22px] bg-[var(--ground-3)] ring-[6px] ring-white md:left-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/media/${heroWorks[1].id}`} alt={heroWorks[1].alt ?? "Trabajo de Siempre Divas"} className="h-full w-full object-cover" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-[28px] bg-[var(--ground-3)] p-[12%] md:ml-[12%] md:aspect-[5/6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo-deep.svg" alt="Siempre Divas, salón de belleza" className="w-full max-w-[420px]" />
              </div>
            )}
          </div>
        </section>

        {/* ── Datos rápidos ───────────────────────────────────────────── */}
        <section aria-label="Horario y ubicación" className="bg-[var(--ground-2)] px-[var(--margin)] py-8">
          <dl className="grid gap-6 sm:grid-cols-3">
            {[
              ["Horario", hrs.days, hrs.time],
              ["Dónde", settings.address, settings.city],
              ["WhatsApp", prettyPhone(wa), "Citas y consultas"],
            ].map(([k, v, note], i) => (
              <div key={k} data-reveal style={{ "--i": i } as React.CSSProperties}>
                <dt className="text-[14px] text-[var(--gold-deep)]">{k}</dt>
                <dd className="tabular text-[20px] leading-snug">{v}</dd>
                <dd className="text-[15px] text-[var(--ink-soft)]">{note}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Trabajos ────────────────────────────────────────────────── */}
        <section id="trabajos" className="scroll-mt-20 px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="trabajos-h">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="trabajos-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
              Nuestros trabajos
            </h2>
            {works.length > 0 && (
              <Link href="/trabajos" className="link text-[17px] font-medium text-[var(--gold-deep)]">
                Ver los {works.length} trabajos
              </Link>
            )}
          </div>
          <div className="mt-8">
            {works.length > 0 ? (
              <WorkGallery works={works} categories={categories} limit={8} />
            ) : (
              <div className="rounded-3xl bg-[var(--ground-3)] px-6 py-14 text-center">
                <p className="display text-[clamp(28px,3vw,40px)]">Muy pronto, aquí</p>
                <p className="mx-auto mt-3 max-w-[40ch] text-[var(--ink-soft)]">
                  Estamos subiendo los cortes, colores y diseños que hacemos cada día. Mientras tanto, míralos en Instagram.
                </p>
                <a href={settings.instagram} target="_blank" rel="noreferrer" className="btn mt-6">
                  @{igHandle}
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Servicios por tipo ──────────────────────────────────────── */}
        <section id="servicios" className="scroll-mt-20 bg-[var(--ground-2)] px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="servicios-h">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="servicios-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
              ¿Qué te hacemos hoy?
            </h2>
            <p data-reveal className="max-w-[36ch] text-[var(--ink-soft)]">
              Toca un tipo de servicio para ver precios o reserva directo.
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
            {menu.map((c, i) => {
              // Precio de entrada sin contar extras de pocos minutos (ej: decoración por uña).
              const base = c.services.filter((s) => s.durationMin >= 20);
              const from = Math.min(...(base.length ? base : c.services).map((s) => s.price));
              return (
                <li key={c.id} data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <a href={`#cat-${c.id}`} className="tile flex h-full min-h-[148px] flex-col justify-between rounded-2xl bg-white p-5">
                    <span className="display text-[clamp(26px,2.4vw,34px)]">{c.name}</span>
                    <span className="mt-6 text-[15px] text-[var(--ink-soft)]">
                      {c.services.length} servicios · <span className="whitespace-nowrap">desde <span className="tabular text-[var(--ink)]">{money(from)}</span></span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Precios ─────────────────────────────────────────────────── */}
        <section id="precios" className="scroll-mt-20 px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="precios-h">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 id="precios-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
                Precios
              </h2>
              <p data-reveal className="mt-4 max-w-[34ch] text-[var(--ink-soft)]">
                En dólares. Los que dicen “desde” dependen del largo o del diseño; te confirmamos el valor antes de empezar.
              </p>
              <Link href="/reservar" className="btn mt-6 max-lg:hidden">
                Reservar ahora
              </Link>
            </div>
            <div className="space-y-2 lg:col-span-8">
              {menu.map((c, i) => (
                <details key={c.id} id={`cat-${c.id}`} open={i === 0} className="scroll-mt-24 rounded-2xl bg-[var(--ground-2)]" data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <summary className="flex min-h-16 items-center justify-between px-5">
                    <span className="display text-[24px]">{c.name}</span>
                    <span className="plus text-[26px] leading-none font-light text-[var(--gold-deep)]" aria-hidden>
                      +
                    </span>
                  </summary>
                  <ul className="space-y-1 px-2 pb-3">
                    {c.services.map((s) => (
                      <li key={s.id}>
                        <Link href={`/reservar?s=${s.id}`} className="tile flex items-baseline justify-between gap-4 rounded-xl px-3 py-3">
                          <span>
                            <span className="block text-[17px]">{s.name}</span>
                            <span className="block text-[14px] text-[var(--ink-soft)]">
                              {s.description ? `${s.description} · ` : ""}
                              {s.durationMin} min
                            </span>
                          </span>
                          <span className="tabular shrink-0 text-[17px] font-medium">
                            {s.priceFrom && <span className="text-[14px] font-normal text-[var(--ink-soft)]">desde </span>}
                            {money(s.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <Link href="/reservar" className="btn mt-4 w-full lg:hidden">
                Reservar ahora
              </Link>
            </div>
          </div>
        </section>

        {/* ── Promos (campo dorado) ───────────────────────────────────── */}
        {promos.length > 0 && (
          <section className="bg-[var(--accent)] px-[var(--margin)] py-[clamp(72px,9vw,120px)] text-[var(--ink)]" aria-labelledby="promos-h">
            <h2 id="promos-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
              Promos del mes
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-2">
              {promos.map((p, i) => (
                <li key={p.id} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex gap-5 rounded-3xl bg-white/85 p-4 sm:p-5">
                  {p.mediaId && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${p.mediaId}`} alt={p.title} loading="lazy" className="aspect-[4/5] w-28 shrink-0 rounded-2xl object-cover sm:w-36" />
                  )}
                  <div className="min-w-0">
                    <p className="display text-[clamp(24px,2.4vw,32px)]">{p.title}</p>
                    {p.priceText && <p className="tabular mt-1 text-[22px] font-medium text-[var(--gold-deep)]">{p.priceText}</p>}
                    {p.description && <p className="mt-2 text-[16px] text-[var(--ink-soft)]">{p.description}</p>}
                    <p className="mt-2 text-[14px] text-[var(--ink-soft)]">{p.validUntil ? `Hasta el ${shortDate(p.validUntil)}` : "Por tiempo limitado"}</p>
                    <a href={waLink(wa, MSG.promo(p.title))} target="_blank" rel="noreferrer" className="btn btn-dark mt-4 min-h-11 px-5 text-[15px]">
                      La quiero
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Cómo reservar ───────────────────────────────────────────── */}
        <section className="px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="como-h">
          <h2 id="como-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
            Reservar es fácil
          </h2>
          <ol className="mt-10 grid gap-3 md:grid-cols-3">
            {[
              ["Elige tu servicio", "Uno o varios: corte, color, uñas, cejas…"],
              ["Escoge día y hora", "Solo ves las horas que de verdad están libres."],
              ["Te confirmamos", "Minerva te escribe por WhatsApp. Así de simple."],
            ].map(([t, d], i) => (
              <li key={t} data-reveal style={{ "--i": i } as React.CSSProperties} className="rounded-3xl bg-[var(--ground-2)] p-6">
                <span className="display block text-[40px] leading-none text-[var(--accent)]" aria-hidden>
                  {["I", "II", "III"][i]}
                </span>
                <p className="mt-5 text-[20px] font-medium">{t}</p>
                <p className="mt-1 text-[var(--ink-soft)]">{d}</p>
              </li>
            ))}
          </ol>
          <Link href="/reservar" className="btn mt-8">
            Empezar mi reserva
          </Link>
        </section>

        {/* ── Equipo ──────────────────────────────────────────────────── */}
        {people.length > 0 && (
          <section id="equipo" className="scroll-mt-20 bg-[var(--ground-2)] px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="equipo-h">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 id="equipo-h" data-reveal className="display text-[clamp(38px,5vw,64px)]">
                  Nuestro equipo
                </h2>
                <p data-reveal className="mt-4 max-w-[42ch] text-[var(--ink-soft)]">
                  {settings.aboutText}
                </p>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2 lg:col-span-7">
                {people.map((p, i) => {
                  const name = fullName(p);
                  const initials = name
                    .split(" ")
                    .slice(0, 2)
                    .map((x) => x[0])
                    .join("");
                  return (
                    <li key={p.id} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex items-center gap-4 rounded-2xl bg-white p-4">
                      <span className="display flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--ground-3)] text-[22px] text-[var(--gold-deep)]" aria-hidden>
                        {initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[18px]">{name}</span>
                        <span className="block text-[15px] text-[var(--gold-deep)]">{positionOf(p) ?? ""}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        {/* ── Preguntas ───────────────────────────────────────────────── */}
        <section className="px-[var(--margin)] py-[clamp(72px,9vw,128px)]" aria-labelledby="faq-h">
          <div className="grid gap-10 lg:grid-cols-12">
            <h2 id="faq-h" data-reveal className="display text-[clamp(38px,5vw,64px)] lg:col-span-4">
              Preguntas frecuentes
            </h2>
            <div className="space-y-2 lg:col-span-8">
              {faq(settings.bookingPolicy, settings.address, settings.city).map((f, i) => (
                <details key={f.q} className="rounded-2xl bg-[var(--ground-2)]" data-reveal style={{ "--i": i } as React.CSSProperties}>
                  <summary className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 text-[18px]">
                    {f.q}
                    <span className="plus shrink-0 text-[26px] leading-none font-light text-[var(--gold-deep)]" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="max-w-[56ch] px-5 pb-5 text-[var(--ink-soft)]">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contacto ────────────────────────────────────────────────── */}
        <section id="contacto" className="scroll-mt-20 px-[var(--margin)] pb-[clamp(72px,9vw,128px)]" aria-labelledby="contacto-h">
          <div className="grid gap-8 rounded-[32px] bg-[var(--ground-3)] p-[clamp(24px,5vw,64px)] lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="contacto-h" className="display text-[clamp(38px,5vw,64px)]">
                Escríbenos
              </h2>
              <p className="mt-3 max-w-[36ch] text-[var(--ink-soft)]">Para precios de diseños, dudas o tu turno de hoy. Respondemos rápido.</p>
              <a href={waLink(wa, MSG.hello)} target="_blank" rel="noreferrer" className="display tabular mt-8 block text-[clamp(40px,7vw,88px)] leading-none text-[var(--gold-deep)]">
                {prettyPhone(wa)}
              </a>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={waLink(wa, MSG.hello)} target="_blank" rel="noreferrer" className="btn">
                  Abrir WhatsApp
                </a>
                <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-soft bg-white">
                  Cómo llegar
                </a>
              </div>
            </div>
            <dl className="space-y-5 lg:col-span-4 lg:col-start-9">
              <div>
                <dt className="text-[14px] text-[var(--gold-deep)]">Dirección</dt>
                <dd className="text-[18px]">
                  {settings.address}, {settings.city}
                </dd>
              </div>
              <div>
                <dt className="text-[14px] text-[var(--gold-deep)]">Horario</dt>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <dd key={d} className="tabular flex justify-between text-[16px]">
                    <span>{DAY_NAMES[d]}</span>
                    <span className="text-[var(--ink-soft)]">
                      {settings.hours[d] ? `${settings.hours[d]!.open} – ${settings.hours[d]!.close}` : "Cerrado"}
                    </span>
                  </dd>
                ))}
              </div>
            </dl>
          </div>
        </section>
      </main>

      <SiteFooter settings={settings} />

      {/* Botón fijo de reserva en el celular */}
      <div className="fixed right-4 bottom-[max(env(safe-area-inset-bottom),16px)] z-40 md:hidden">
        {/* taste-skill-ignore: botón flotante real, la sombra lo separa del contenido que pasa debajo */}
        <Link href="/reservar" className="btn shadow-[0_10px_30px_rgba(140,106,46,.35)]" /* taste-skill-ignore */>
          Reservar
        </Link>
      </div>
    </>
  );
}
