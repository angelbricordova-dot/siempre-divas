import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AddToCalendar } from "@/components/site/add-to-calendar";
import { money } from "@/lib/money";
import { MSG } from "@/lib/messages";
import { waLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { localDate, localTime, prettyDate, prettyTime } from "@/lib/time";
import { verifyId } from "@/lib/token";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "¡Cita reservada!", robots: { index: false } };

export default async function ListoPage({ searchParams }: { searchParams: Promise<{ c?: string; t?: string }> }) {
  const sp = await searchParams;
  const id = Number(sp.c);
  if (!id || !verifyId(id, sp.t)) notFound();
  const [row] = await db
    .select({ a: schema.appointments, staffName: schema.staff.name })
    .from(schema.appointments)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.appointments.staffId))
    .where(eq(schema.appointments.id, id));
  if (!row) notFound();
  const settings = await getSettings();
  const { a } = row;
  const date = localDate(a.startsAt);
  const time = localTime(a.startsAt);
  const services = a.items.map((i) => i.name).join(", ");
  const total = a.items.reduce((s, i) => s + i.price, 0);
  const msg = MSG.booked(services, `${prettyDate(date)} a las ${prettyTime(time)}`, a.clientName);

  return (
    <main className="px-[var(--margin)] pt-[max(env(safe-area-inset-top),20px)] pb-20">
      <Link href="/" aria-label="Volver al inicio">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-horizontal-deep.svg" alt="Siempre Divas" className="h-9 w-auto" />
      </Link>
      <h1 className="display mt-14 text-[clamp(56px,10vw,128px)]">
        ¡Lista, <em className="gold">diva!</em>
      </h1>
      <p className="mt-5 max-w-[34ch] text-[clamp(18px,1.4vw,21px)] text-[var(--ink-soft)]">
        {a.clientName.split(" ")[0]}, tu cita quedó registrada. Minerva te escribirá para confirmarla.
      </p>
      <dl className="mt-10 grid max-w-xl gap-2">
        {[
          ["Cuándo", `${prettyDate(date)}, ${prettyTime(time)}`],
          ["Servicio", services],
          ["Con", row.staffName ?? "Quien esté libre"],
          ["Valor aproximado", money(total)],
          ["Dónde", `${settings.address}, ${settings.city}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-[var(--ground-2)] px-5 py-4">
            <dt className="text-[14px] text-[var(--ink-soft)]">{k}</dt>
            <dd className="text-[18px] first-letter:uppercase">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 flex max-w-xl flex-col gap-2 sm:flex-row">
        <a href={waLink(settings.whatsapp, msg)} target="_blank" rel="noreferrer" className="btn">
          Avisar por WhatsApp
        </a>
        <AddToCalendar
          title={`Cita en Siempre Divas: ${services}`}
          start={a.startsAt.toISOString()}
          end={a.endsAt.toISOString()}
          location={`${settings.address}, ${settings.city}`}
        />
      </div>
      <p className="mt-8 max-w-[52ch] text-[15px] text-[var(--ink-soft)]">{settings.bookingPolicy}</p>
      <Link href="/" className="link mt-8 inline-block text-[16px]">
        Volver al inicio
      </Link>
    </main>
  );
}
