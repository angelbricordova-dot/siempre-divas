import { and, desc, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { Empty, PageHeader, Section } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { money } from "@/lib/money";
import { MONTHS, localDate, monthStart, shortDate } from "@/lib/time";
import { deleteExpense } from "./actions";
import { ExpenseForm } from "./form";

export const metadata = { title: "Gastos" };

export default async function GastosPage() {
  await requireOwner();
  const today = localDate();
  const ms = monthStart(today);
  const rows = await db
    .select()
    .from(schema.expenses)
    .where(and(gte(schema.expenses.date, ms), lte(schema.expenses.date, today)))
    .orderBy(desc(schema.expenses.date), desc(schema.expenses.createdAt));
  const byCat = await db
    .select({ category: schema.expenses.category, total: sql<number>`sum(${schema.expenses.amount})::int` })
    .from(schema.expenses)
    .where(and(gte(schema.expenses.date, ms), lte(schema.expenses.date, today)))
    .groupBy(schema.expenses.category)
    .orderBy(sql`2 desc`);
  const total = rows.reduce((a, r) => a + r.amount, 0);
  return (
    <>
      <PageHeader title="Gastos" back="/admin/mas" subtitle={`${money(total)} en ${MONTHS[Number(today.slice(5, 7)) - 1]}`} />
      <Section>
        <div className="rounded-2xl bg-surface p-4">
          <ExpenseForm today={today} />
        </div>
      </Section>
      {byCat.length > 0 && (
        <Section title="Este mes por categoría" className="mt-6">
          <ul className="space-y-1.5">
            {byCat.map((c) => (
              <li key={c.category} className="relative overflow-hidden rounded-xl bg-surface px-4 py-3">
                <span className="absolute inset-y-0 left-0 bg-gold-soft" style={{ width: `${(c.total / total) * 100}%` }} aria-hidden />
                <span className="relative flex justify-between text-[15px]">
                  <span>{c.category}</span>
                  <span className="tabular font-semibold">{money(c.total)}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Movimientos" className="mt-6">
        {rows.length === 0 ? (
          <Empty title="Sin gastos este mes" />
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px]">{r.description || r.category}</p>
                  <p className="text-[13px] text-muted">
                    {shortDate(r.date)} · {r.category} · {r.method}
                  </p>
                </div>
                <span className="tabular text-[16px] font-semibold">{money(r.amount)}</span>
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="¿Borrar este gasto?" className="press h-9 w-9 rounded-lg text-muted">
                    ✕
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
