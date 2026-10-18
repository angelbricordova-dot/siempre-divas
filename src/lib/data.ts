import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

export async function listStaff(opts: { includeInactive?: boolean; includeOwner?: boolean } = {}) {
  const rows = await db
    .select()
    .from(schema.staff)
    .orderBy(asc(schema.staff.sort), asc(schema.staff.name));
  return rows.filter(
    (s) => (opts.includeInactive || s.active) && (opts.includeOwner !== false || s.role !== "owner"),
  );
}

export async function listCatalog(opts: { onlyActive?: boolean } = {}) {
  const cats = await db.select().from(schema.serviceCategories).orderBy(asc(schema.serviceCategories.sort));
  const svcs = await db
    .select()
    .from(schema.services)
    .where(opts.onlyActive ? eq(schema.services.active, true) : undefined)
    .orderBy(asc(schema.services.sort), asc(schema.services.name));
  return cats.map((c) => ({ ...c, services: svcs.filter((s) => s.categoryId === c.id) }));
}

export async function listClientsLite() {
  return db
    .select({ id: schema.clients.id, name: schema.clients.name, phone: schema.clients.phone })
    .from(schema.clients)
    .orderBy(desc(schema.clients.createdAt))
    .limit(2000);
}

export async function pendingTickets() {
  const rows = await db
    .select({
      ticket: schema.tickets,
      createdBy: schema.staff.name,
    })
    .from(schema.tickets)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.tickets.createdById))
    .where(eq(schema.tickets.status, "pendiente"))
    .orderBy(asc(schema.tickets.createdAt));
  const items = rows.length
    ? await db
        .select({ item: schema.ticketItems, staffName: schema.staff.name, staffColor: schema.staff.color })
        .from(schema.ticketItems)
        .leftJoin(schema.staff, eq(schema.staff.id, schema.ticketItems.staffId))
        .where(inArray(schema.ticketItems.ticketId, rows.map((r) => r.ticket.id)))
    : [];
  return rows.map((r) => ({
    ...r.ticket,
    createdByName: r.createdBy,
    items: items.filter((i) => i.item.ticketId === r.ticket.id),
  }));
}

export async function getTicketWithItems(id: number) {
  const [t] = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id));
  if (!t) return null;
  const items = await db
    .select({ item: schema.ticketItems, staffName: schema.staff.name, staffColor: schema.staff.color })
    .from(schema.ticketItems)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.ticketItems.staffId))
    .where(eq(schema.ticketItems.ticketId, id))
    .orderBy(asc(schema.ticketItems.id));
  const [client] = t.clientId
    ? await db.select().from(schema.clients).where(eq(schema.clients.id, t.clientId))
    : [];
  return { ticket: t, items, client: client ?? null };
}

export async function getStaff(id: number) {
  const [row] = await db.select().from(schema.staff).where(and(eq(schema.staff.id, id)));
  return row ?? null;
}
