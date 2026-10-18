import Link from "next/link";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Avatar, ButtonLink, Empty, PageHeader, Pill, cx } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listStaff } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/labels";
import { money } from "@/lib/money";
import { DAY_SHORT, addDays, endOfDay, localDate, localTime, prettyDate, relativeDay, startOfDay, weekday } from "@/lib/time";

export const metadata = { title: "Agenda" };


export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ d?: string; s?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = localDate();
  const date = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
  const staffFilter = sp.s === "all" ? null : sp.s ? Number(sp.s) : user.role === "staff" ? user.id : null;
  const staff = await listStaff({ includeOwner: true });

  const rows = await db
    .select({ a: schema.appointments, staffName: schema.staff.name, staffColor: schema.staff.color })
    .from(schema.appointments)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.appointments.staffId))
    .where(
      and(
        gte(schema.appointments.startsAt, startOfDay(date)),
        lt(schema.appointments.startsAt, endOfDay(date)),
        staffFilter ? eq(schema.appointments.staffId, staffFilter) : undefined,
      ),
    )
    .orderBy(asc(schema.appointments.startsAt));

  // Cantidad de citas activas por día para la tira de fechas.
  const stripStart = addDays(date, -3);
  const counts = await db
    .select({
      d: sql<string>`to_char(${schema.appointments.startsAt} at time zone 'America/Guayaquil', 'YYYY-MM-DD')`,
      n: sql<number>`count(*)::int`,
    })
    .from(schema.appointments)
    .where(
      and(
        gte(schema.appointments.startsAt, startOfDay(stripStart)),
        lt(schema.appointments.startsAt, endOfDay(addDays(stripStart, 13))),
        sql`${schema.appointments.status} in ('pendiente','confirmada','completada')`,
        staffFilter ? eq(schema.appointments.staffId, staffFilter) : undefined,
      ),
    )
    .groupBy(sql`1`);

  const qs = (d: string, s?: string | number | null) => {
    const p = new URLSearchParams({ d });
    if (s !== undefined && s !== null) p.set("s", String(s));
    return `/admin/agenda?${p.toString()}`;
  };
  const sParam = sp.s ?? null;
  const active = rows.filter((r) => r.a.status !== "cancelada");

  return (
    <>
      <PageHeader
        title={relativeDay(date, today)}
        subtitle={`${prettyDate(date, { year: false })} · ${active.length} cita${active.length === 1 ? "" : "s"}`}
        action={<ButtonLink href={`/admin/agenda/nueva?d=${date}`} size="md">Nueva cita</ButtonLink>}
      />

      <nav aria-label="Días" className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-2 lg:px-0">
        <Link href={qs(addDays(date, -7), sParam)} className="press flex h-16 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface text-muted" aria-label="Semana anterior">
          ‹
        </Link>
        {Array.from({ length: 14 }, (_, i) => addDays(stripStart, i)).map((d) => {
          const n = counts.find((c) => c.d === d)?.n ?? 0;
          const selected = d === date;
          return (
            <Link
              key={d}
              href={qs(d, sParam)}
              className={cx(
                "press flex h-16 w-13 shrink-0 flex-col items-center justify-center rounded-2xl",
                selected ? "bg-ink text-bg" : "bg-surface",
                d === today && !selected && "ring-2 ring-gold",
              )}
            >
              <span className={cx("text-[12px]", selected ? "opacity-70" : "text-muted")}>{DAY_SHORT[weekday(d)]}</span>
              <span className="tabular text-[18px] leading-tight font-semibold">{Number(d.slice(8))}</span>
              <span className={cx("h-1.5 w-1.5 rounded-full", n ? (selected ? "bg-brand-gold" : "bg-gold") : "bg-transparent")} />
            </Link>
          );
        })}
        <Link href={qs(addDays(date, 7), sParam)} className="press flex h-16 w-10 shrink-0 items-center justify-center rounded-2xl bg-surface text-muted" aria-label="Semana siguiente">
          ›
        </Link>
      </nav>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pt-1 pb-3 lg:px-0">
        <Link
          href={qs(date, "all")}
          className={cx("press h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-9 font-medium", !staffFilter ? "bg-gold text-on-gold" : "bg-surface")}
        >
          Todas
        </Link>
        {staff.map((s) => (
          <Link
            key={s.id}
            href={qs(date, s.id)}
            className={cx(
              "press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium",
              staffFilter === s.id ? "bg-gold text-on-gold" : "bg-surface",
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.name.split(" ")[0]}
          </Link>
        ))}
      </div>

      <section className="px-4 lg:px-0">
        {rows.length === 0 ? (
          <Empty title="Sin citas este día">
            <Link href={`/admin/agenda/nueva?d=${date}`} className="font-semibold text-gold">
              Agendar una cita
            </Link>
          </Empty>
        ) : (
          <ol className="space-y-2">
            {rows.map(({ a, staffName, staffColor }) => {
              const st = STATUS_LABEL[a.status];
              const dimmed = a.status === "cancelada" || a.status === "no_asistio";
              return (
                <li key={a.id}>
                  <Link
                    href={`/admin/agenda/${a.id}`}
                    className={cx("press flex gap-3 overflow-hidden rounded-2xl bg-surface p-3", dimmed && "opacity-55")}
                  >
                    <span className="w-1 shrink-0 rounded-full" style={{ background: staffColor ?? "#999" }} aria-hidden />
                    <div className="w-14 shrink-0">
                      <p className="tabular text-[17px] font-bold">{localTime(a.startsAt)}</p>
                      <p className="tabular text-[13px] text-muted">{localTime(a.endsAt)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold">{a.clientName}</p>
                      <p className="truncate text-[14px] text-muted">{a.items.map((i) => i.name).join(", ")}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Pill tone={st.tone}>{st.label}</Pill>
                        {a.source === "web" && <Pill tone="gold">Web</Pill>}
                        {staffName && (
                          <span className="inline-flex items-center gap-1 text-[13px] text-muted">
                            <Avatar name={staffName} color={staffColor ?? "#999"} size={18} /> {staffName.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="tabular shrink-0 text-[15px] font-semibold text-muted">
                      {money(a.items.reduce((s, i) => s + i.price, 0))}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
