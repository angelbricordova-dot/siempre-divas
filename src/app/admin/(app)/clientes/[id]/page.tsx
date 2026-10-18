import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { IconWhatsApp } from "@/components/admin/icons";
import { PageHeader, Pill, Section, Stat, buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/labels";
import { money } from "@/lib/money";
import { prettyPhone, waLink } from "@/lib/phone";
import { localDate, localTime, shortDate } from "@/lib/time";
import { deleteClient } from "../actions";
import { ClientForm } from "../client-form";

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, id));
  if (!c) notFound();
  const tickets = await db.select().from(schema.tickets).where(eq(schema.tickets.clientId, id)).orderBy(desc(schema.tickets.createdAt)).limit(50);
  const paid = tickets.filter((t) => t.status === "pagado");
  const ids = paid.map((t) => t.id);
  const items = ids.length
    ? await db.select().from(schema.ticketItems).where(inArray(schema.ticketItems.ticketId, ids))
    : [];
  const appts = await db.select().from(schema.appointments).where(eq(schema.appointments.clientId, id)).orderBy(desc(schema.appointments.startsAt)).limit(20);
  const spent = paid.reduce((a, t) => a + t.total, 0);
  const first = c.name.split(" ")[0];
  const missYou = `Hola ${first} 💛 Te extrañamos en *Siempre Divas*. ¿Te agendamos para consentirte esta semana? Responde este mensaje y te buscamos un turno ✨`;
  const bday = `¡Feliz cumpleaños, ${first}! 🎂✨ En *Siempre Divas* queremos celebrarte: este mes tienes un detalle especial en tu próximo servicio. ¡Te esperamos!`;

  return (
    <>
      <PageHeader title={c.name} back="/admin/clientes" subtitle={prettyPhone(c.phone) || "Sin teléfono"} />
      <div className="grid grid-cols-3 gap-2 px-4 lg:px-0">
        <Stat label="Visitas" value={paid.length} />
        <Stat label="Gastado" value={money(spent)} />
        <Stat label="Faltas" value={c.noShows} tone={c.noShows ? "bad" : undefined} />
      </div>
      {c.phone && (
        <div className="mt-3 grid grid-cols-2 gap-2 px-4 lg:px-0">
          <a href={waLink(c.phone)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
            <IconWhatsApp width={20} height={20} /> Escribir
          </a>
          <a href={waLink(c.phone, missYou)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
            Te extrañamos
          </a>
          {c.birthday && (
            <a href={waLink(c.phone, bday)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg", "col-span-2")}>
              🎂 Saludo de cumpleaños ({shortDate(c.birthday)})
            </a>
          )}
        </div>
      )}
      <div className="mt-2 px-4 lg:px-0">
        <Link href="/admin/agenda/nueva" className={buttonClass("primary", "lg", "w-full")}>
          Agendar cita
        </Link>
      </div>

      {(appts.length > 0 || items.length > 0) && (
        <Section title="Historial" className="mt-6">
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {appts.map((a) => (
              <li key={`a${a.id}`}>
                <Link href={`/admin/agenda/${a.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover-lift">
                  <span className="min-w-0">
                    <span className="block truncate text-[16px]">{a.items.map((i) => i.name).join(", ")}</span>
                    <span className="text-[13px] text-muted">Cita · {shortDate(localDate(a.startsAt))} {localTime(a.startsAt)}</span>
                  </span>
                  <Pill tone={STATUS_LABEL[a.status].tone}>{STATUS_LABEL[a.status].label}</Pill>
                </Link>
              </li>
            ))}
            {paid.map((t) => (
              <li key={`t${t.id}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-[16px]">{items.filter((i) => i.ticketId === t.id).map((i) => i.description).join(", ")}</span>
                  <span className="text-[13px] text-muted">Pagó · {shortDate(localDate(t.paidAt!))}</span>
                </span>
                <span className="tabular text-[16px] font-semibold">{money(t.total)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Datos" className="mt-6">
        <div className="rounded-2xl bg-surface p-4">
          <ClientForm client={c} />
        </div>
      </Section>
      {user.role === "owner" && (
        <form action={deleteClient} className="mt-6 px-4 lg:px-0">
          <input type="hidden" name="id" value={c.id} />
          <ConfirmButton message={`¿Borrar a ${c.name}? Su historial de cobros se conserva sin nombre.`} className={buttonClass("ghost", "md", "w-full text-bad")}>
            Borrar clienta
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
