import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, buttonClass } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { money } from "@/lib/money";
import { waLink } from "@/lib/phone";
import { localDate, prettyDate, shortDate } from "@/lib/time";

export default async function PayoutPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const id = Number((await params).id);
  const [row] = await db
    .select({ p: schema.payouts, name: schema.staff.name, phone: schema.staff.phone })
    .from(schema.payouts)
    .innerJoin(schema.staff, eq(schema.staff.id, schema.payouts.staffId))
    .where(eq(schema.payouts.id, id));
  if (!row) notFound();
  const { p } = row;
  const from = p.periodStart ? shortDate(localDate(p.periodStart)) : null;
  const to = shortDate(localDate(p.periodEnd));
  const text = [
    `*Siempre Divas · Pago a ${row.name}*`,
    from ? `Del ${from} al ${to}` : `Al ${to}`,
    `Servicios: ${p.servicesCount} (${money(p.grossSales)} cobrados)`,
    `Comisión: ${money(p.commission)}`,
    p.tips ? `Propinas: ${money(p.tips)}` : "",
    p.advances ? `Adelantos: −${money(p.advances)}` : "",
    `*Total pagado: ${money(p.total)}* (${p.method})`,
    `¡Gracias por tu trabajo! 💛`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <PageHeader title="Pago registrado" back={`/admin/cuentas/${p.staffId}`} subtitle={prettyDate(localDate(p.createdAt))} />
      <div className="mx-4 rounded-3xl bg-surface p-6 lg:mx-0">
        <p className="text-[16px] text-muted">Pagado a {row.name}</p>
        <p className="tabular text-[44px] leading-tight font-bold">{money(p.total)}</p>
        <dl className="tabular mt-4 space-y-2 text-[16px]">
          {from && (
            <div className="flex justify-between">
              <dt className="text-muted">Periodo</dt>
              <dd>
                {from} – {to}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Servicios</dt>
            <dd>
              {p.servicesCount} · {money(p.grossSales)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Comisión</dt>
            <dd>{money(p.commission)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Propinas</dt>
            <dd>{money(p.tips)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Adelantos</dt>
            <dd>−{money(p.advances)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Forma de pago</dt>
            <dd className="capitalize">{p.method}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 grid gap-2 px-4 lg:px-0">
        {row.phone && (
          <a href={waLink(row.phone, text)} target="_blank" rel="noreferrer" className={buttonClass("primary", "lg")}>
            Enviar comprobante por WhatsApp
          </a>
        )}
        <Link href="/admin/cuentas" className={buttonClass("secondary", "lg")}>
          Volver a cuentas
        </Link>
      </div>
    </>
  );
}
