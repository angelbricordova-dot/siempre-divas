import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, Section } from "@/components/ui";
import { expectedCash, rangeSummary } from "@/lib/accounting";
import { requireOwner } from "@/lib/auth";
import { METHOD_LABEL } from "@/lib/labels";
import { money, moneyInput } from "@/lib/money";
import { localDate, prettyDate, shortDate } from "@/lib/time";
import { CloseForm } from "./form";

export const metadata = { title: "Cierre de caja" };

export default async function CierrePage() {
  await requireOwner();
  const today = localDate();
  const [cash, summary, [closed], history] = await Promise.all([
    expectedCash(today),
    rangeSummary(today, today),
    db.select().from(schema.cashClosures).where(eq(schema.cashClosures.date, today)),
    db.select().from(schema.cashClosures).orderBy(desc(schema.cashClosures.date)).limit(10),
  ]);
  return (
    <>
      <PageHeader title="Cierre de caja" subtitle={prettyDate(today)} back="/admin/mas" />
      <Section>
        <div className="space-y-px overflow-hidden rounded-2xl">
          {[
            ["Cobros en efectivo", cash.income],
            ["Gastos en efectivo", -cash.expenses],
            ["Adelantos en efectivo", -cash.advances],
            ["Pagos al equipo en efectivo", -cash.payouts],
          ].map(([l, v]) => (
            <div key={l as string} className="flex justify-between bg-surface px-4 py-3.5 text-[16px]">
              <span>{l}</span>
              <span className="tabular">{money(v as number)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-gold-soft px-4 py-4 text-[18px] font-bold text-gold">
            <span>Debe haber en caja</span>
            <span className="tabular">{money(cash.expected)}</span>
          </div>
        </div>
        <p className="mt-2 px-1 text-[13px] text-muted">
          Más el fondo de cambio con el que abriste. Otros medios hoy:{" "}
          {Object.entries(summary.byMethod)
            .filter(([m]) => m !== "efectivo")
            .map(([m, v]) => `${METHOD_LABEL[m] ?? m} ${money(v)}`)
            .join(" · ") || "ninguno"}
          .
        </p>
      </Section>
      <Section className="mt-6">
        <div className="rounded-2xl bg-surface p-4">
          <CloseForm date={today} defaultCounted={closed ? moneyInput(closed.countedCash) : undefined} />
        </div>
      </Section>
      {history.length > 0 && (
        <Section title="Cierres anteriores" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {history.map((h) => {
              const diff = h.countedCash - h.expectedCash;
              return (
                <li key={h.id} className="flex items-center justify-between px-4 py-3 text-[16px]">
                  <span>{shortDate(h.date)}</span>
                  <span className="tabular">
                    {money(h.countedCash)}{" "}
                    <span className={diff === 0 ? "text-ok" : diff > 0 ? "text-warn" : "text-bad"}>
                      ({diff === 0 ? "cuadrada" : money(diff, { sign: true })})
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}
