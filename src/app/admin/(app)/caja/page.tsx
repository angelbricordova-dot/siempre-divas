import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { TicketForm, type TFInitial } from "@/components/admin/ticket-form";
import { Avatar, PageHeader, Pill } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { fullName } from "@/lib/staff-name";
import { getTicketWithItems, listCatalog, listClientsLite, listStaff, pendingTickets } from "@/lib/data";
import { money, moneyInput } from "@/lib/money";
import { localTime } from "@/lib/time";
import { deletePendingTicket } from "./actions";

export const metadata = { title: "Cobrar" };

export default async function CajaPage({ searchParams }: { searchParams: Promise<{ ticket?: string; cita?: string }> }) {
  const user = await requireOwner();
  const sp = await searchParams;
  const [staff, catalog, clients, pend] = await Promise.all([
    listStaff({ includeOwner: true }),
    listCatalog({ onlyActive: true }),
    listClientsLite(),
    pendingTickets(),
  ]);

  let initial: TFInitial | undefined;
  if (sp.ticket) {
    const data = await getTicketWithItems(Number(sp.ticket));
    if (data && data.ticket.status === "pendiente") {
      initial = {
        ticketId: data.ticket.id,
        appointmentId: data.ticket.appointmentId ?? undefined,
        items: data.items.map(({ item }) => ({
          serviceId: item.serviceId,
          description: item.description,
          staffId: item.staffId,
          price: moneyInput(item.price),
        })),
        client: data.client
          ? { id: data.client.id, name: data.client.name, phone: data.client.phone }
          : data.ticket.clientName
            ? { name: data.ticket.clientName }
            : null,
        discount: data.ticket.discount,
        tip: data.ticket.tip,
        notes: data.ticket.notes,
      };
    }
  } else if (sp.cita) {
    const [appt] = await db.select().from(schema.appointments).where(eq(schema.appointments.id, Number(sp.cita)));
    if (appt) {
      initial = {
        appointmentId: appt.id,
        items: appt.items.map((i) => ({
          serviceId: i.serviceId,
          description: i.name,
          staffId: appt.staffId,
          price: moneyInput(i.price),
        })),
        client: { id: appt.clientId, name: appt.clientName, phone: appt.clientPhone },
      };
    }
  }

  const others = pend.filter((p) => p.id !== initial?.ticketId);

  return (
    <>
      <PageHeader
        title={initial?.ticketId ? "Cobrar ticket" : initial?.appointmentId ? "Cobrar cita" : "Cobrar"}
        back={initial ? "/admin/caja" : undefined}
        subtitle={initial ? "Revisa los montos y elige cómo pagó." : "Toca quién atendió y los servicios."}
      />
      {!initial && others.length > 0 && (
        <section className="mb-5 px-4 lg:px-0">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[17px] font-semibold">Por cobrar</h2>
            <Pill tone="warn">{others.length}</Pill>
          </div>
          <ul className="space-y-2">
            {others.map((t) => {
              const first = t.items[0];
              return (
                <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-warn-soft p-2 pl-3">
                  <Link href={`/admin/caja?ticket=${t.id}`} className="press flex min-w-0 flex-1 items-center gap-3 py-1">
                    {first?.staffName && <Avatar name={first.staffName} color={first.staffColor ?? "#999"} size={38} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold">
                        {t.items.map((i) => i.item.description).join(", ")}
                      </span>
                      <span className="block truncate text-[14px] text-muted">
                        {first?.staffName ?? "—"} · {localTime(t.createdAt)}
                        {t.clientName ? ` · ${t.clientName}` : ""}
                      </span>
                    </span>
                    <span className="tabular text-[18px] font-bold">{money(t.total)}</span>
                  </Link>
                  <form action={deletePendingTicket}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="press h-10 w-10 rounded-xl text-muted" aria-label="Descartar">
                      ✕
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <TicketForm
        key={initial?.ticketId ?? initial?.appointmentId ?? "new"}
        staff={staff.map((s) => ({ id: s.id, name: fullName(s), color: s.color, commissionPct: s.commissionPct, role: s.role }))}
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          services: c.services.map((s) => ({ id: s.id, name: s.name, price: s.price, priceFrom: s.priceFrom, commissionPct: s.commissionPct })),
        }))}
        clients={clients}
        role="owner"
        currentUserId={user.id}
        initial={initial}
      />
    </>
  );
}
