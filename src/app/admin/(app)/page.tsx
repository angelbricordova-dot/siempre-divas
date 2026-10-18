import Link from "next/link";
import { and, asc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Avatar, ButtonLink, Chevron, Empty, PageHeader, Pill, Section, Stat } from "@/components/ui";
import { pendingBalances, rangeSummary } from "@/lib/accounting";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { pendingTickets } from "@/lib/data";
import { money } from "@/lib/money";
import { endOfDay, localDate, localTime, prettyDate, relativeDay, startOfDay } from "@/lib/time";

function greeting() {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Guayaquil" }));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function AdminHome() {
  const user = await requireUser();
  return user.role === "owner" ? <OwnerHome user={user} /> : <StaffHome user={user} />;
}

async function upcoming(staffId?: number) {
  const today = localDate();
  return db
    .select({ a: schema.appointments, staffName: schema.staff.name, staffColor: schema.staff.color })
    .from(schema.appointments)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.appointments.staffId))
    .where(
      and(
        gte(schema.appointments.startsAt, startOfDay(today)),
        lt(schema.appointments.startsAt, endOfDay(today)),
        inArray(schema.appointments.status, ["pendiente", "confirmada"]),
        staffId ? eq(schema.appointments.staffId, staffId) : undefined,
      ),
    )
    .orderBy(asc(schema.appointments.startsAt));
}

function AppointmentRow({ a, staffName, staffColor }: Awaited<ReturnType<typeof upcoming>>[number]) {
  return (
    <li>
      <Link href={`/admin/agenda/${a.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
        <p className="tabular w-12 text-[16px] font-bold">{localTime(a.startsAt)}</p>
        <span className="h-9 w-1 rounded-full" style={{ background: staffColor ?? "#999" }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-medium">{a.clientName}</p>
          <p className="truncate text-[14px] text-muted">
            {a.items.map((i) => i.name).join(", ")}
            {staffName ? ` · ${staffName.split(" ")[0]}` : ""}
          </p>
        </div>
        {a.status === "pendiente" && <Pill tone="warn">Confirmar</Pill>}
        <Chevron />
      </Link>
    </li>
  );
}

async function OwnerHome({ user }: { user: CurrentUser }) {
  const today = localDate();
  const [summary, appts, pend, balances, toConfirm] = await Promise.all([
    rangeSummary(today, today),
    upcoming(),
    pendingTickets(),
    pendingBalances(),
    db
      .select({ a: schema.appointments })
      .from(schema.appointments)
      .where(and(eq(schema.appointments.status, "pendiente"), gte(schema.appointments.startsAt, startOfDay(today))))
      .orderBy(asc(schema.appointments.startsAt)),
  ]);
  const owed = balances.reduce((a, b) => a + Math.max(0, b.total), 0);
  const nowIso = new Date();
  const next = appts.filter((r) => r.a.endsAt > nowIso);

  return (
    <>
      <PageHeader title={`${greeting()}, ${user.name.split(" ")[0]}`} subtitle={prettyDate(today)} />

      <div className="grid grid-cols-2 gap-2 px-4 lg:grid-cols-4 lg:px-0">
        <Stat label="Cobrado hoy" value={money(summary.gross + summary.tips)} hint={`${summary.servicesCount} servicios`} />
        <Stat label="Para el salón hoy" value={money(summary.salonShare)} tone="gold" hint={`Equipo: ${money(summary.staffShare)}`} />
        <Link href="/admin/caja" className="press">
          <Stat label="Por cobrar" value={pend.length} tone={pend.length ? "bad" : undefined} hint={pend.length ? money(pend.reduce((a, p) => a + p.total, 0)) : "Todo al día"} />
        </Link>
        <Link href="/admin/cuentas" className="press">
          <Stat label="Debes al equipo" value={money(owed)} hint="Ver cuentas" />
        </Link>
      </div>

      {toConfirm.length > 0 && (
        <Section className="mt-5">
          <Link href={`/admin/agenda/${toConfirm[0].a.id}`} className="press flex items-center gap-3 rounded-2xl bg-warn-soft p-4 text-warn">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warn text-[17px] font-bold text-white">{toConfirm.length}</span>
            <span className="flex-1 text-[16px] font-semibold">
              {toConfirm.length === 1 ? "Cita nueva por confirmar" : "Citas nuevas por confirmar"}
              <span className="block text-[14px] font-normal">
                {toConfirm[0].a.clientName} · {relativeDay(localDate(toConfirm[0].a.startsAt))} {localTime(toConfirm[0].a.startsAt)}
              </span>
            </span>
            <Chevron />
          </Link>
        </Section>
      )}

      {pend.length > 0 && (
        <Section title="Por cobrar" className="mt-6" action={<Link href="/admin/caja" className="text-[15px] font-semibold text-gold">Ir a caja</Link>}>
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {pend.slice(0, 4).map((t) => (
              <li key={t.id}>
                <Link href={`/admin/caja?ticket=${t.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
                  {t.items[0]?.staffName && <Avatar name={t.items[0].staffName} color={t.items[0].staffColor ?? "#999"} size={34} />}
                  <span className="min-w-0 flex-1 truncate text-[16px]">{t.items.map((i) => i.item.description).join(", ")}</span>
                  <span className="tabular text-[17px] font-bold">{money(t.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Próximas citas de hoy" className="mt-6" action={<Link href="/admin/agenda" className="text-[15px] font-semibold text-gold">Agenda</Link>}>
        {next.length === 0 ? (
          <Empty title="No quedan citas hoy">
            <Link href="/admin/agenda/nueva" className="font-semibold text-gold">Agendar una</Link>
          </Empty>
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {next.slice(0, 6).map((r) => (
              <AppointmentRow key={r.a.id} {...r} />
            ))}
          </ul>
        )}
      </Section>

      {summary.byStaff.length > 0 && (
        <Section title="El equipo hoy" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {summary.byStaff.map((s) => (
              <li key={s.staffId ?? "salon"} className="flex items-center gap-3 px-4 py-3">
                <Avatar name={s.name} color={s.color} size={34} />
                <div className="flex-1">
                  <p className="text-[16px] font-medium">{s.name}</p>
                  <p className="text-[13px] text-muted">
                    {s.count} servicio{s.count === 1 ? "" : "s"} · {money(s.gross)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular text-[16px] font-semibold">{money(s.staffAmount)}</p>
                  <p className="text-[12px] text-muted">gana</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Atajos" className="mt-6">
        <div className="grid grid-cols-2 gap-2">
          <ButtonLink href="/admin/agenda/nueva" variant="secondary" size="lg">Nueva cita</ButtonLink>
          <ButtonLink href="/admin/gastos" variant="secondary" size="lg">Anotar gasto</ButtonLink>
          <ButtonLink href="/admin/cierre" variant="secondary" size="lg">Cierre de caja</ButtonLink>
          <ButtonLink href="/admin/clientes" variant="secondary" size="lg">Clientas</ButtonLink>
          <ButtonLink href="/admin/web" variant="secondary" size="lg">Subir fotos</ButtonLink>
          <ButtonLink href="/admin/reportes" variant="secondary" size="lg">Reportes</ButtonLink>
        </div>
      </Section>
    </>
  );
}

async function StaffHome({ user }: { user: CurrentUser }) {
  const today = localDate();
  const [appts, [balance], todayEarned, mine] = await Promise.all([
    upcoming(user.id),
    pendingBalances(user.id),
    db
      .select({ v: sql<number>`coalesce(sum(${schema.ticketItems.staffAmount}),0)::int`, n: sql<number>`count(*)::int` })
      .from(schema.ticketItems)
      .innerJoin(schema.tickets, eq(schema.tickets.id, schema.ticketItems.ticketId))
      .where(
        and(
          eq(schema.ticketItems.staffId, user.id),
          eq(schema.tickets.status, "pagado"),
          gte(schema.tickets.paidAt, startOfDay(today)),
          lt(schema.tickets.paidAt, endOfDay(today)),
        ),
      ),
    pendingTickets().then((list) => list.filter((t) => t.createdById === user.id)),
  ]);
  return (
    <>
      <PageHeader title={`${greeting()}, ${user.name.split(" ")[0]}`} subtitle={prettyDate(today)} />
      <div className="grid grid-cols-2 gap-2 px-4 lg:px-0">
        <Stat label="Ganaste hoy" value={money(todayEarned[0]?.v ?? 0)} tone="gold" hint={`${todayEarned[0]?.n ?? 0} servicios cobrados`} />
        <Link href="/admin/mis-ganancias" className="press">
          <Stat label="Tu próximo pago" value={money(balance?.total ?? 0)} hint="Ver detalle" />
        </Link>
      </div>
      <div className="mt-4 px-4 lg:px-0">
        <ButtonLink href="/admin/registrar" size="lg" className="w-full">
          Registrar un servicio
        </ButtonLink>
      </div>
      {mine.length > 0 && (
        <Section title="Esperando cobro" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {mine.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-[16px]">
                <span className="truncate">{t.items.map((i) => i.item.description).join(", ")}</span>
                <span className="tabular font-semibold">{money(t.total)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Tus citas de hoy" className="mt-6" action={<Link href="/admin/agenda/nueva" className="text-[15px] font-semibold text-gold">Agendar</Link>}>
        {appts.length === 0 ? (
          <Empty title="Sin citas por ahora" />
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {appts.map((r) => (
              <AppointmentRow key={r.a.id} {...r} />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
