import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { Avatar, Empty, PageHeader, Section } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { fullName } from "@/lib/staff-name";
import { money } from "@/lib/money";
import { localDate, shortDate } from "@/lib/time";

export const metadata = { title: "Historial de pagos" };

export default async function HistorialPage() {
  await requireOwner();
  const rows = await db
    .select({ p: schema.payouts, first: schema.staff.name, lastName: schema.staff.lastName, color: schema.staff.color })
    .from(schema.payouts)
    .innerJoin(schema.staff, eq(schema.staff.id, schema.payouts.staffId))
    .orderBy(desc(schema.payouts.createdAt))
    .limit(200);
  return (
    <>
      <PageHeader title="Historial de pagos" back="/admin/cuentas" />
      <Section>
        {rows.length === 0 ? (
          <Empty title="Todavía no hay pagos">Cuando pagues a alguien del equipo, quedará registrado aquí.</Empty>
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {rows.map(({ p, first, lastName, color }) => {
              const name = fullName({ name: first, lastName });
              return (
              <li key={p.id}>
                <Link href={`/admin/cuentas/pago/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
                  <Avatar name={name} color={color} size={36} />
                  <div className="flex-1">
                    <p className="text-[16px] font-medium">{name}</p>
                    <p className="text-[13px] text-muted">
                      {shortDate(localDate(p.createdAt))} · {p.servicesCount} servicios · {p.method}
                    </p>
                  </div>
                  <span className="tabular text-[17px] font-semibold">{money(p.total)}</span>
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
