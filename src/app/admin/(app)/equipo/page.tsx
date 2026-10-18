import Link from "next/link";
import { Avatar, Chevron, PageHeader, Pill, Section, buttonClass } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { listStaff } from "@/lib/data";
import { DAY_SHORT } from "@/lib/time";

export const metadata = { title: "Equipo" };

export default async function EquipoPage() {
  await requireOwner();
  const staff = await listStaff({ includeInactive: true, includeOwner: true });
  return (
    <>
      <PageHeader title="Equipo" back="/admin/mas" action={<Link href="/admin/equipo/nuevo" className={buttonClass("primary", "md")}>Agregar</Link>} />
      <Section>
        <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
          {staff.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/equipo/${s.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
                <Avatar name={s.name} color={s.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium">
                    {s.name} {s.role === "owner" && <Pill tone="gold">Dueña</Pill>} {!s.active && <Pill tone="bad">Inactiva</Pill>}
                  </p>
                  <p className="truncate text-[13px] text-muted">
                    {s.role === "owner" ? "Todo lo que hace queda para el salón" : `Gana ${s.commissionPct}%`}
                    {s.daysOff.length ? ` · libre ${s.daysOff.map((d) => DAY_SHORT[d]).join(", ")}` : ""}
                    {s.username ? ` · usuario ${s.username}` : " · sin acceso"}
                  </p>
                </div>
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 px-1 text-[13px] text-muted">
          Cada servicio cobrado guarda el % del momento: si cambias el porcentaje, lo anterior no se altera.
        </p>
      </Section>
    </>
  );
}
