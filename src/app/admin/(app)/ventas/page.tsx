import Link from "next/link";
import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { Empty, PageHeader, Pill, Section, Stat, cx } from "@/components/ui";
import { rangeSummary } from "@/lib/accounting";
import { requireOwner } from "@/lib/auth";
import { METHOD_LABEL } from "@/lib/labels";
import { money } from "@/lib/money";
import { addDays, endOfDay, localDate, localTime, relativeDay, startOfDay } from "@/lib/time";
import { voidTicket } from "../caja/actions";

export const metadata = { title: "Ventas" };

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const today = localDate();
  const date = sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d) ? sp.d : today;
  const [summary, tickets] = await Promise.all([
    rangeSummary(date, date),
    db
      .select()
      .from(schema.tickets)
      .where(and(inArray(schema.tickets.status, ["pagado", "anulado"]), gte(schema.tickets.paidAt, startOfDay(date)), lt(schema.tickets.paidAt, endOfDay(date))))
      .orderBy(desc(schema.tickets.paidAt)),
  ]);
  const items = tickets.length
    ? await db
        .select({ item: schema.ticketItems, staffName: schema.staff.name })
        .from(schema.ticketItems)
        .leftJoin(schema.staff, eq(schema.staff.id, schema.ticketItems.staffId))
        .where(inArray(schema.ticketItems.ticketId, tickets.map((t) => t.id)))
    : [];

  return (
    <>
      <PageHeader title="Ventas" subtitle={relativeDay(date, today)} back="/admin/mas" />
      <div className="flex items-center gap-2 px-4 pb-3 lg:px-0">
        <Link href={`/admin/ventas?d=${addDays(date, -1)}`} className="press h-10 rounded-xl bg-surface px-4 text-[15px] leading-10 font-medium">‹ Anterior</Link>
        {date !== today && <Link href="/admin/ventas" className="press h-10 rounded-xl bg-surface px-4 text-[15px] leading-10 font-medium">Hoy</Link>}
        {date < today && <Link href={`/admin/ventas?d=${addDays(date, 1)}`} className="press h-10 rounded-xl bg-surface px-4 text-[15px] leading-10 font-medium">Siguiente ›</Link>}
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4 lg:px-0">
        <Stat label="Cobrado" value={money(summary.gross + summary.tips)} />
        <Stat label="Para el salón" value={money(summary.salonShare)} tone="gold" />
        <Stat label="Para el equipo" value={money(summary.staffShare + summary.tips)} />
        <Stat label="Tickets" value={summary.ticketsCount} />
      </div>
      {Object.keys(summary.byMethod).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-4 lg:px-0">
          {Object.entries(summary.byMethod).map(([m, v]) => (
            <Pill key={m}>{METHOD_LABEL[m] ?? m}: {money(v)}</Pill>
          ))}
        </div>
      )}
      <Section title="Tickets" className="mt-6">
        {tickets.length === 0 ? (
          <Empty title="Sin ventas este día" />
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => {
              const its = items.filter((i) => i.item.ticketId === t.id);
              const voided = t.status === "anulado";
              return (
                <li key={t.id} className={cx("rounded-2xl bg-surface p-4", voided && "opacity-60")}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] text-muted">
                        #{t.id} · {localTime(t.paidAt!)} · {METHOD_LABEL[t.paymentMethod ?? ""] ?? "—"}
                        {t.clientName ? ` · ${t.clientName}` : ""}
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {its.map(({ item, staffName }) => (
                          <li key={item.id} className="text-[16px]">
                            {item.description} <span className="text-muted">· {staffName ?? "salón"}</span>
                          </li>
                        ))}
                      </ul>
                      {t.discount > 0 && <p className="text-[14px] text-muted">Descuento {money(t.discount)}</p>}
                      {t.tip > 0 && <p className="text-[14px] text-muted">Propina {money(t.tip)}</p>}
                      {voided && <Pill tone="bad">Anulado{t.voidReason ? `: ${t.voidReason}` : ""}</Pill>}
                    </div>
                    <p className={cx("tabular text-[18px] font-bold", voided && "line-through")}>{money(t.total + t.tip)}</p>
                  </div>
                  {!voided && (
                    <form action={voidTicket} className="mt-2 flex justify-end">
                      <input type="hidden" name="id" value={t.id} />
                      <ConfirmButton message="¿Anular este cobro? Se quitará de las cuentas." className="press h-9 rounded-lg px-3 text-[14px] font-medium text-bad">
                        Anular
                      </ConfirmButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
