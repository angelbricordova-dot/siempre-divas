import Link from "next/link";
import { Avatar, Chevron, PageHeader, Section, Stat } from "@/components/ui";
import { pendingBalances, rangeSummary } from "@/lib/accounting";
import { requireOwner } from "@/lib/auth";
import { money } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { DAY_NAMES, addDays, localDate, shortDate, weekStart } from "@/lib/time";

export const metadata = { title: "Cuentas" };

export default async function CuentasPage() {
  await requireOwner();
  const settings = await getSettings();
  const today = localDate();
  const ws = weekStart(today, settings.weekStartsOn);
  const [balances, week] = await Promise.all([pendingBalances(), rangeSummary(ws, today)]);
  const owed = balances.reduce((a, b) => a + Math.max(0, b.total), 0);

  return (
    <>
      <PageHeader title="Cuentas" subtitle="Al día, sin esperar al fin de semana." />
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-0">
        <Stat label="Por pagar al equipo" value={money(owed)} tone="gold" hint="Todo lo no liquidado" />
        <Stat
          label="Ganancia del salón"
          value={money(week.net)}
          tone={week.net >= 0 ? "ok" : "bad"}
          hint={`Desde el ${DAY_NAMES[settings.weekStartsOn].toLowerCase()} ${shortDate(ws)}`}
        />
      </div>

      <Section title="Lo que se debe a cada una" className="mt-6">
        {balances.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-[15px] text-muted">
            Aún no hay trabajadoras. Agrégalas en <Link href="/admin/equipo" className="font-semibold text-gold">Equipo</Link>.
          </p>
        ) : (
          <ul className="space-y-2">
            {balances.map((b) => (
              <li key={b.staffId}>
                <Link href={`/admin/cuentas/${b.staffId}`} className="press block rounded-2xl bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.name} color={b.color} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold">{b.name}</p>
                      <p className="text-[14px] text-muted">
                        {b.servicesCount} servicio{b.servicesCount === 1 ? "" : "s"} · {b.commissionPct}%
                        {b.since ? ` · desde ${shortDate(localDate(b.since))}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular text-[22px] leading-none font-bold">{money(b.total)}</p>
                      <p className="mt-1 text-[13px] text-muted">a pagar</p>
                    </div>
                    <Chevron />
                  </div>
                  {(b.tips > 0 || b.advances > 0) && (
                    <p className="tabular mt-2 pl-13 text-[14px] text-muted">
                      Comisión {money(b.commission)}
                      {b.tips > 0 && ` + propinas ${money(b.tips)}`}
                      {b.advances > 0 && ` − adelantos ${money(b.advances)}`}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Esta semana" className="mt-6">
        <div className="space-y-px overflow-hidden rounded-2xl">
          {[
            ["Cobrado por servicios", week.gross],
            ["Para el equipo", -week.staffShare],
            ["Para el salón", week.salonShare],
            ["Gastos", -week.expenses],
          ].map(([label, v]) => (
            <div key={label as string} className="flex justify-between bg-surface px-4 py-3.5 text-[16px]">
              <span>{label}</span>
              <span className="tabular font-medium">{money(v as number)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-gold-soft px-4 py-4 text-[17px] font-bold text-gold">
            <span>Ganancia neta</span>
            <span className="tabular">{money(week.net)}</span>
          </div>
        </div>
        <p className="mt-2 px-1 text-[13px] text-muted">
          Semana de cuentas: {DAY_NAMES[settings.weekStartsOn].toLowerCase()} a{" "}
          {DAY_NAMES[(settings.weekStartsOn + 6) % 7].toLowerCase()} ({shortDate(ws)} – {shortDate(addDays(ws, 6))}). Cámbiala en Ajustes.
        </p>
      </Section>

      <Section className="mt-6">
        <div className="grid grid-cols-2 gap-2">
          <Link href="/admin/cuentas/historial" className="press rounded-2xl bg-surface p-4 text-[16px] font-semibold">
            Historial de pagos
          </Link>
          <Link href="/admin/reportes" className="press rounded-2xl bg-surface p-4 text-[16px] font-semibold">
            Reportes
          </Link>
        </div>
      </Section>
    </>
  );
}
