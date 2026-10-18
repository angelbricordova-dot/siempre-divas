import { notFound } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { Avatar, Empty, PageHeader, Section, buttonClass, inputClass } from "@/components/ui";
import { pendingBalances } from "@/lib/accounting";
import { requireOwner } from "@/lib/auth";
import { money } from "@/lib/money";
import { localDate, localTime, relativeDay, shortDate } from "@/lib/time";
import { deleteAdvance, payStaff } from "../actions";
import { AdvanceButton } from "../advance-form";

export default async function StaffAccountPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const id = Number((await params).id);
  const [worker] = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
  if (!worker) notFound();
  const [balance] = await pendingBalances(id);

  const items = await db
    .select({
      id: schema.ticketItems.id,
      description: schema.ticketItems.description,
      net: schema.ticketItems.netPrice,
      pct: schema.ticketItems.commissionPct,
      earned: schema.ticketItems.staffAmount,
      paidAt: schema.tickets.paidAt,
      clientName: schema.tickets.clientName,
    })
    .from(schema.ticketItems)
    .innerJoin(schema.tickets, eq(schema.tickets.id, schema.ticketItems.ticketId))
    .where(and(eq(schema.ticketItems.staffId, id), eq(schema.tickets.status, "pagado"), isNull(schema.ticketItems.payoutId)))
    .orderBy(desc(schema.tickets.paidAt));

  const tips = await db
    .select({ id: schema.tickets.id, tip: schema.tickets.tip, paidAt: schema.tickets.paidAt })
    .from(schema.tickets)
    .where(and(eq(schema.tickets.tipStaffId, id), eq(schema.tickets.status, "pagado"), isNull(schema.tickets.tipPayoutId), sql`${schema.tickets.tip} > 0`));

  const advs = await db
    .select()
    .from(schema.advances)
    .where(and(eq(schema.advances.staffId, id), isNull(schema.advances.payoutId)))
    .orderBy(desc(schema.advances.createdAt));

  const history = await db
    .select()
    .from(schema.payouts)
    .where(eq(schema.payouts.staffId, id))
    .orderBy(desc(schema.payouts.createdAt))
    .limit(8);

  const byDay = new Map<string, typeof items>();
  for (const it of items) {
    const d = localDate(it.paidAt!);
    byDay.set(d, [...(byDay.get(d) ?? []), it]);
  }

  const total = balance?.total ?? 0;

  return (
    <>
      <PageHeader title={worker.name} back="/admin/cuentas" subtitle={`Gana el ${worker.commissionPct}% de cada servicio`} />

      <div className="mx-4 rounded-3xl bg-ink p-5 text-bg lg:mx-0">
        <div className="flex items-center gap-3">
          <Avatar name={worker.name} color={worker.color} size={44} />
          <div>
            <p className="text-[15px] opacity-70">A pagar hoy</p>
            <p className="tabular text-[38px] leading-none font-bold">{money(total)}</p>
          </div>
        </div>
        <dl className="tabular mt-4 grid grid-cols-3 gap-2 text-[14px]">
          <div className="rounded-xl bg-white/10 p-2.5">
            <dt className="opacity-70">Comisión</dt>
            <dd className="text-[17px] font-semibold">{money(balance?.commission ?? 0)}</dd>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <dt className="opacity-70">Propinas</dt>
            <dd className="text-[17px] font-semibold">{money(balance?.tips ?? 0)}</dd>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5">
            <dt className="opacity-70">Adelantos</dt>
            <dd className="text-[17px] font-semibold">−{money(balance?.advances ?? 0)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[14px] opacity-70">
          {items.length} servicios por {money(balance?.grossSales ?? 0)} cobrados
          {balance?.since ? ` desde el ${shortDate(localDate(balance.since))}` : ""}.
        </p>
      </div>

      <div className="mt-3 grid gap-2 px-4 lg:px-0">
        {(items.length > 0 || tips.length > 0 || advs.length > 0) && (
          <form action={payStaff} className="grid grid-cols-[1fr_auto] gap-2">
            <input type="hidden" name="staffId" value={id} />
            <select name="method" className={inputClass} defaultValue="efectivo" aria-label="Forma de pago">
              <option value="efectivo">Pagar en efectivo</option>
              <option value="transferencia">Pagar por transferencia</option>
            </select>
            <ConfirmButton
              message={`¿Marcar ${money(total)} como pagado a ${worker.name}? Lo pendiente quedará en cero.`}
              className={buttonClass("primary", "md")}
            >
              Pagar {money(total)}
            </ConfirmButton>
          </form>
        )}
        <AdvanceButton staffId={id} name={worker.name} />
      </div>

      <Section title="Servicios sin pagar" className="mt-6">
        {items.length === 0 ? (
          <Empty title="Nada pendiente">Cuando cobres un servicio de {worker.name} aparecerá aquí.</Empty>
        ) : (
          <div className="space-y-4">
            {[...byDay.entries()].map(([day, list]) => (
              <div key={day}>
                <p className="mb-1.5 flex justify-between px-1 text-[14px] font-medium text-muted">
                  <span>{relativeDay(day)}</span>
                  <span className="tabular">gana {money(list.reduce((a, i) => a + i.earned, 0))}</span>
                </p>
                <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
                  {list.map((it) => (
                    <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px]">{it.description}</p>
                        <p className="text-[13px] text-muted">
                          {localTime(it.paidAt!)}
                          {it.clientName ? ` · ${it.clientName}` : ""} · {money(it.net)} × {it.pct}%
                        </p>
                      </div>
                      <p className="tabular text-[17px] font-semibold">{money(it.earned)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      {tips.length > 0 && (
        <Section title="Propinas" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {tips.map((t) => (
              <li key={t.id} className="flex justify-between px-4 py-3 text-[16px]">
                <span>{relativeDay(localDate(t.paidAt!))}</span>
                <span className="tabular font-semibold">{money(t.tip)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {advs.length > 0 && (
        <Section title="Adelantos por descontar" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {advs.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1">
                  <p className="text-[16px]">{relativeDay(localDate(a.createdAt))}</p>
                  {a.note && <p className="text-[13px] text-muted">{a.note}</p>}
                </div>
                <span className="tabular text-[16px] font-semibold text-bad">−{money(a.amount)}</span>
                <form action={deleteAdvance}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton message="¿Borrar este adelanto?" className="press h-9 w-9 rounded-lg text-muted">
                    ✕
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Pagos anteriores" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {history.map((p) => (
              <li key={p.id}>
                <a href={`/admin/cuentas/pago/${p.id}`} className="flex justify-between px-4 py-3 text-[16px] hover-lift">
                  <span>
                    {shortDate(localDate(p.createdAt))} · {p.servicesCount} servicios
                  </span>
                  <span className="tabular font-semibold">{money(p.total)}</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
