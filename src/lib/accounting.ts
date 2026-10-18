import "server-only";
import { and, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { distributeDiscount, splitCommission } from "./money";
import { fullName } from "./staff-name";
import { endOfDay, localDate, startOfDay } from "./time";

const { tickets, ticketItems, staff, advances, expenses, services } = schema;

export type DraftItem = {
  serviceId: number | null;
  description: string;
  staffId: number | null;
  price: number; // centavos
};

/** Calcula el reparto de cada ítem con los porcentajes actuales. */
export async function buildItems(items: DraftItem[], discount: number) {
  const staffIds = [...new Set(items.map((i) => i.staffId).filter((x): x is number => !!x))];
  const serviceIds = [...new Set(items.map((i) => i.serviceId).filter((x): x is number => !!x))];
  const staffRows = staffIds.length
    ? await db.select().from(staff).where(inArray(staff.id, staffIds))
    : [];
  const serviceRows = serviceIds.length
    ? await db.select().from(services).where(inArray(services.id, serviceIds))
    : [];
  const nets = distributeDiscount(
    items.map((i) => i.price),
    discount,
  );
  return items.map((item, idx) => {
    const worker = staffRows.find((s) => s.id === item.staffId);
    const service = serviceRows.find((s) => s.id === item.serviceId);
    // La dueña no cobra comisión: todo lo que ella hace queda para el salón.
    let pct = worker ? (worker.role === "owner" ? 0 : worker.commissionPct) : 0;
    if (worker && worker.role !== "owner" && service?.commissionPct != null) pct = service.commissionPct;
    const net = nets[idx];
    const { staffAmount, salonAmount } = splitCommission(net, pct);
    return {
      serviceId: item.serviceId,
      description: item.description,
      staffId: item.staffId,
      price: item.price,
      netPrice: net,
      commissionPct: pct,
      staffAmount,
      salonAmount,
    };
  });
}

export type StaffBalance = {
  staffId: number;
  name: string;
  color: string;
  commissionPct: number;
  servicesCount: number;
  grossSales: number;
  commission: number;
  tips: number;
  advances: number;
  total: number;
  since: Date | null;
};

/** Lo que se le debe a cada trabajadora desde su último pago (todo lo no liquidado). */
export async function pendingBalances(staffId?: number): Promise<StaffBalance[]> {
  const workers = await db
    .select()
    .from(staff)
    .where(and(ne(staff.role, "owner"), staffId ? eq(staff.id, staffId) : undefined))
    .orderBy(staff.sort, staff.name);

  const itemRows = await db
    .select({
      staffId: ticketItems.staffId,
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${ticketItems.netPrice}),0)::int`,
      commission: sql<number>`coalesce(sum(${ticketItems.staffAmount}),0)::int`,
      since: sql<string | null>`min(${tickets.paidAt})`,
    })
    .from(ticketItems)
    .innerJoin(tickets, eq(tickets.id, ticketItems.ticketId))
    .where(and(eq(tickets.status, "pagado"), isNull(ticketItems.payoutId)))
    .groupBy(ticketItems.staffId);

  const tipRows = await db
    .select({
      staffId: tickets.tipStaffId,
      tips: sql<number>`coalesce(sum(${tickets.tip}),0)::int`,
    })
    .from(tickets)
    .where(and(eq(tickets.status, "pagado"), isNull(tickets.tipPayoutId), sql`${tickets.tip} > 0`))
    .groupBy(tickets.tipStaffId);

  const advRows = await db
    .select({
      staffId: advances.staffId,
      total: sql<number>`coalesce(sum(${advances.amount}),0)::int`,
    })
    .from(advances)
    .where(isNull(advances.payoutId))
    .groupBy(advances.staffId);

  return workers
    .map((w) => {
      const it = itemRows.find((r) => r.staffId === w.id);
      const tips = tipRows.find((r) => r.staffId === w.id)?.tips ?? 0;
      const adv = advRows.find((r) => r.staffId === w.id)?.total ?? 0;
      const commission = it?.commission ?? 0;
      return {
        staffId: w.id,
        name: fullName(w),
        color: w.color,
        commissionPct: w.commissionPct,
        servicesCount: it?.count ?? 0,
        grossSales: it?.gross ?? 0,
        commission,
        tips,
        advances: adv,
        total: commission + tips - adv,
        since: it?.since ? new Date(it.since) : null,
        active: w.active,
      };
    })
    .filter((b) => b.active || b.servicesCount > 0 || b.advances > 0 || b.tips > 0);
}

export type RangeSummary = {
  ticketsCount: number;
  servicesCount: number;
  gross: number; // cobrado por servicios (después de descuentos)
  discounts: number;
  tips: number;
  staffShare: number;
  salonShare: number;
  expenses: number;
  net: number; // ganancia del salón menos gastos
  byMethod: Record<string, number>;
  byStaff: { staffId: number | null; name: string; color: string; count: number; gross: number; staffAmount: number; salonAmount: number }[];
  byDay: { date: string; gross: number; salon: number }[];
  topServices: { name: string; count: number; gross: number }[];
};

export async function rangeSummary(from: string, toInclusive: string): Promise<RangeSummary> {
  const start = startOfDay(from);
  const end = endOfDay(toInclusive);
  const paidInRange = and(eq(tickets.status, "pagado"), gte(tickets.paidAt, start), lt(tickets.paidAt, end));

  const [t] = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${tickets.total}),0)::int`,
      discount: sql<number>`coalesce(sum(${tickets.discount}),0)::int`,
      tips: sql<number>`coalesce(sum(${tickets.tip}),0)::int`,
    })
    .from(tickets)
    .where(paidInRange);

  const methodRows = await db
    .select({
      method: tickets.paymentMethod,
      total: sql<number>`coalesce(sum(${tickets.total} + ${tickets.tip}),0)::int`,
    })
    .from(tickets)
    .where(paidInRange)
    .groupBy(tickets.paymentMethod);

  const staffRows = await db
    .select({
      staffId: ticketItems.staffId,
      name: sql<string>`coalesce(trim(${staff.name} || ' ' || coalesce(${staff.lastName}, '')), 'Venta del salón')`,
      color: sql<string>`coalesce(${staff.color}, '#8a8a8a')`,
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${ticketItems.netPrice}),0)::int`,
      staffAmount: sql<number>`coalesce(sum(${ticketItems.staffAmount}),0)::int`,
      salonAmount: sql<number>`coalesce(sum(${ticketItems.salonAmount}),0)::int`,
    })
    .from(ticketItems)
    .innerJoin(tickets, eq(tickets.id, ticketItems.ticketId))
    .leftJoin(staff, eq(staff.id, ticketItems.staffId))
    .where(paidInRange)
    .groupBy(ticketItems.staffId, staff.name, staff.lastName, staff.color)
    .orderBy(sql`sum(${ticketItems.netPrice}) desc`);

  const dayRows = await db
    .select({
      date: sql<string>`to_char(${tickets.paidAt} at time zone 'America/Guayaquil', 'YYYY-MM-DD')`,
      gross: sql<number>`coalesce(sum(${ticketItems.netPrice}),0)::int`,
      salon: sql<number>`coalesce(sum(${ticketItems.salonAmount}),0)::int`,
    })
    .from(ticketItems)
    .innerJoin(tickets, eq(tickets.id, ticketItems.ticketId))
    .where(paidInRange)
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const topRows = await db
    .select({
      name: ticketItems.description,
      count: sql<number>`count(*)::int`,
      gross: sql<number>`coalesce(sum(${ticketItems.netPrice}),0)::int`,
    })
    .from(ticketItems)
    .innerJoin(tickets, eq(tickets.id, ticketItems.ticketId))
    .where(paidInRange)
    .groupBy(ticketItems.description)
    .orderBy(sql`count(*) desc`)
    .limit(8);

  const [e] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}),0)::int` })
    .from(expenses)
    .where(and(gte(expenses.date, from), lt(expenses.date, addOne(toInclusive))));

  const staffShare = staffRows.reduce((a, r) => a + r.staffAmount, 0);
  const salonShare = staffRows.reduce((a, r) => a + r.salonAmount, 0);
  const servicesCount = staffRows.reduce((a, r) => a + r.count, 0);
  const byMethod: Record<string, number> = {};
  for (const r of methodRows) byMethod[r.method ?? "otro"] = r.total;

  return {
    ticketsCount: t.count,
    servicesCount,
    gross: t.total,
    discounts: t.discount,
    tips: t.tips,
    staffShare,
    salonShare,
    expenses: e.total,
    net: salonShare - e.total,
    byMethod,
    byStaff: staffRows,
    byDay: dayRows,
    topServices: topRows,
  };
}

function addOne(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Efectivo esperado en caja para un día: cobros en efectivo − gastos en efectivo − adelantos y pagos en efectivo. */
export async function expectedCash(date: string = localDate()) {
  const start = startOfDay(date);
  const end = endOfDay(date);
  const [inc] = await db
    .select({ total: sql<number>`coalesce(sum(${tickets.total} + ${tickets.tip}),0)::int` })
    .from(tickets)
    .where(
      and(
        eq(tickets.status, "pagado"),
        eq(tickets.paymentMethod, "efectivo"),
        gte(tickets.paidAt, start),
        lt(tickets.paidAt, end),
      ),
    );
  const [exp] = await db
    .select({ total: sql<number>`coalesce(sum(${expenses.amount}),0)::int` })
    .from(expenses)
    .where(and(eq(expenses.date, date), eq(expenses.method, "efectivo")));
  const [adv] = await db
    .select({ total: sql<number>`coalesce(sum(${advances.amount}),0)::int` })
    .from(advances)
    .where(and(eq(advances.method, "efectivo"), gte(advances.createdAt, start), lt(advances.createdAt, end)));
  const [pay] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.payouts.total}),0)::int` })
    .from(schema.payouts)
    .where(
      and(
        eq(schema.payouts.method, "efectivo"),
        gte(schema.payouts.createdAt, start),
        lt(schema.payouts.createdAt, end),
      ),
    );
  return {
    income: inc.total,
    expenses: exp.total,
    advances: adv.total,
    payouts: Math.max(0, pay.total),
    expected: inc.total - exp.total - adv.total - Math.max(0, pay.total),
  };
}
