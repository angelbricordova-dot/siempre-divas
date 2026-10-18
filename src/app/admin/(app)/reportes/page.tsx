import Link from "next/link";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { DayChart } from "@/components/admin/day-chart";
import { Avatar, Empty, PageHeader, Section, Stat, buttonClass, cx } from "@/components/ui";
import { rangeSummary } from "@/lib/accounting";
import { requireOwner } from "@/lib/auth";
import { METHOD_LABEL } from "@/lib/labels";
import { money } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { addDays, endOfDay, localDate, monthStart, shortDate, startOfDay, weekStart } from "@/lib/time";

export const metadata = { title: "Reportes" };

export default async function ReportesPage({ searchParams }: { searchParams: Promise<{ r?: string; from?: string; to?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const settings = await getSettings();
  const today = localDate();
  const ranges: Record<string, [string, string, string]> = {
    hoy: ["Hoy", today, today],
    semana: ["Esta semana", weekStart(today, settings.weekStartsOn), today],
    pasada: ["Semana pasada", addDays(weekStart(today, settings.weekStartsOn), -7), addDays(weekStart(today, settings.weekStartsOn), -1)],
    mes: ["Este mes", monthStart(today), today],
    anterior: ["Mes anterior", monthStart(addDays(monthStart(today), -1)), addDays(monthStart(today), -1)],
  };
  const key = sp.r && ranges[sp.r] ? sp.r : sp.from && sp.to ? "custom" : "mes";
  const [, from, to] = key === "custom" ? ["", sp.from!, sp.to!] : ranges[key];
  const s = await rangeSummary(from, to);

  const [appts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      web: sql<number>`count(*) filter (where ${schema.appointments.source} = 'web')::int`,
      noShow: sql<number>`count(*) filter (where ${schema.appointments.status} = 'no_asistio')::int`,
      cancelled: sql<number>`count(*) filter (where ${schema.appointments.status} = 'cancelada')::int`,
    })
    .from(schema.appointments)
    .where(and(gte(schema.appointments.startsAt, startOfDay(from)), lt(schema.appointments.startsAt, endOfDay(to))));
  const [newClients] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.clients)
    .where(and(gte(schema.clients.createdAt, startOfDay(from)), lt(schema.clients.createdAt, endOfDay(to))));
  const avgTicket = s.ticketsCount ? Math.round(s.gross / s.ticketsCount) : 0;

  // Rellenar días sin ventas para que el gráfico no salte fechas.
  const days: { date: string; gross: number; salon: number }[] = [];
  for (let d = from; d <= to && days.length < 62; d = addDays(d, 1)) {
    const row = s.byDay.find((x) => x.date === d);
    days.push({ date: d, gross: row?.gross ?? 0, salon: row?.salon ?? 0 });
  }

  return (
    <>
      <PageHeader title="Reportes" back="/admin/mas" subtitle={from === to ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`} />
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3 lg:px-0">
        {Object.entries(ranges).map(([k, [label]]) => (
          <Link key={k} href={`/admin/reportes?r=${k}`} className={cx("press h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-9 font-medium", key === k ? "bg-gold text-on-gold" : "bg-surface")}>
            {label}
          </Link>
        ))}
      </div>
      <form className="mb-4 grid grid-cols-[1fr_1fr_auto] gap-2 px-4 lg:px-0">
        <input type="date" name="from" defaultValue={from} className="h-11 rounded-xl bg-surface px-3 text-[15px]" aria-label="Desde" />
        <input type="date" name="to" defaultValue={to} className="h-11 rounded-xl bg-surface px-3 text-[15px]" aria-label="Hasta" />
        <button className={buttonClass("secondary", "sm", "h-11")}>Ver</button>
      </form>

      <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4 lg:px-0">
        <Stat label="Cobrado" value={money(s.gross)} hint={`${s.ticketsCount} tickets`} />
        <Stat label="Ganancia neta" value={money(s.net)} tone={s.net >= 0 ? "ok" : "bad"} hint="Salón − gastos" />
        <Stat label="Ticket promedio" value={money(avgTicket)} />
        <Stat label="Clientas nuevas" value={newClients.n} />
      </div>

      <Section title="Cobrado por día" className="mt-6">
        {s.gross === 0 ? <Empty title="Sin ventas en este periodo" /> : <DayChart data={days} />}
      </Section>

      <Section title="Cómo se repartió" className="mt-6">
        <div className="space-y-px overflow-hidden rounded-2xl">
          {[
            ["Cobrado por servicios", s.gross],
            ["Descuentos dados", -s.discounts],
            ["Comisiones del equipo", -s.staffShare],
            ["Propinas (para el equipo)", s.tips],
            ["Parte del salón", s.salonShare],
            ["Gastos", -s.expenses],
          ].map(([l, v]) => (
            <div key={l as string} className="flex justify-between bg-surface px-4 py-3.5 text-[16px]">
              <span>{l}</span>
              <span className="tabular">{money(v as number)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-gold-soft px-4 py-4 text-[17px] font-bold text-gold">
            <span>Ganancia neta</span>
            <span className="tabular">{money(s.net)}</span>
          </div>
        </div>
      </Section>

      {s.byStaff.length > 0 && (
        <Section title="Por persona" className="mt-6">
          <div className="overflow-x-auto rounded-2xl bg-surface">
            <table className="tabular w-full text-[15px]">
              <thead className="text-left text-[13px] text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nombre</th>
                  <th className="px-2 py-2.5 text-right font-medium">Serv.</th>
                  <th className="px-2 py-2.5 text-right font-medium">Cobrado</th>
                  <th className="px-4 py-2.5 text-right font-medium">Ganó</th>
                </tr>
              </thead>
              <tbody>
                {s.byStaff.map((r) => (
                  <tr key={r.staffId ?? "salon"} className="border-t border-surface-2">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <Avatar name={r.name} color={r.color} size={26} /> {r.name.split(" ")[0]}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">{r.count}</td>
                    <td className="px-2 py-3 text-right">{money(r.gross)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{money(r.staffAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {s.topServices.length > 0 && (
        <Section title="Servicios más pedidos" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {s.topServices.map((t) => (
              <li key={t.name} className="flex justify-between gap-3 px-4 py-3 text-[16px]">
                <span className="truncate">{t.name}</span>
                <span className="tabular shrink-0 text-muted">
                  {t.count} · <span className="font-semibold text-ink">{money(t.gross)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Pagos y citas" className="mt-6">
        <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface text-[16px]">
          {Object.entries(s.byMethod).map(([m, v]) => (
            <li key={m} className="flex justify-between px-4 py-3">
              <span>{METHOD_LABEL[m] ?? m}</span>
              <span className="tabular font-semibold">{money(v)}</span>
            </li>
          ))}
          <li className="flex justify-between px-4 py-3">
            <span>Citas agendadas</span>
            <span className="tabular">{appts.total} ({appts.web} por la web)</span>
          </li>
          <li className="flex justify-between px-4 py-3">
            <span>No vinieron / canceladas</span>
            <span className="tabular">{appts.noShow} / {appts.cancelled}</span>
          </li>
        </ul>
      </Section>

      <div className="mt-6 px-4 lg:px-0">
        <a href={`/api/export?from=${from}&to=${to}`} className={buttonClass("secondary", "lg", "w-full")}>
          Descargar en Excel (CSV)
        </a>
      </div>
    </>
  );
}
