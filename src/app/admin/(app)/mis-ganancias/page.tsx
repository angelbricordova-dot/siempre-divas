import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { Empty, PageHeader, Section, Stat } from "@/components/ui";
import { pendingBalances } from "@/lib/accounting";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/money";
import { localDate, localTime, relativeDay, shortDate } from "@/lib/time";

export const metadata = { title: "Mis ganancias" };

export default async function MisGananciasPage() {
  const user = await requireUser();
  const [balance] = await pendingBalances(user.id);
  const items = await db
    .select({
      id: schema.ticketItems.id,
      description: schema.ticketItems.description,
      net: schema.ticketItems.netPrice,
      earned: schema.ticketItems.staffAmount,
      paidAt: schema.tickets.paidAt,
    })
    .from(schema.ticketItems)
    .innerJoin(schema.tickets, eq(schema.tickets.id, schema.ticketItems.ticketId))
    .where(and(eq(schema.ticketItems.staffId, user.id), eq(schema.tickets.status, "pagado"), isNull(schema.ticketItems.payoutId)))
    .orderBy(desc(schema.tickets.paidAt));
  const payouts = await db
    .select()
    .from(schema.payouts)
    .where(eq(schema.payouts.staffId, user.id))
    .orderBy(desc(schema.payouts.createdAt))
    .limit(10);
  return (
    <>
      <PageHeader title="Mis ganancias" subtitle={`Ganas el ${user.commissionPct}% de cada servicio`} />
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-0">
        <Stat label="Próximo pago" value={money(balance?.total ?? 0)} tone="gold" />
        <Stat label="Servicios" value={balance?.servicesCount ?? 0} hint={money(balance?.grossSales ?? 0)} />
      </div>
      {(balance?.tips || balance?.advances) ? (
        <p className="tabular mt-2 px-5 text-[14px] text-muted lg:px-1">
          Comisión {money(balance.commission)} + propinas {money(balance.tips)} − adelantos {money(balance.advances)}
        </p>
      ) : null}
      <Section title="Desde tu último pago" className="mt-6">
        {items.length === 0 ? (
          <Empty title="Aún nada por aquí">Cuando Minerva cobre tus servicios aparecerán aquí.</Empty>
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px]">{i.description}</p>
                  <p className="text-[13px] text-muted">
                    {relativeDay(localDate(i.paidAt!))} {localTime(i.paidAt!)} · {money(i.net)}
                  </p>
                </div>
                <span className="tabular text-[16px] font-semibold">{money(i.earned)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {payouts.length > 0 && (
        <Section title="Pagos recibidos" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {payouts.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-3 text-[16px]">
                <span>{shortDate(localDate(p.createdAt))} · {p.servicesCount} servicios</span>
                <span className="tabular font-semibold">{money(p.total)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
