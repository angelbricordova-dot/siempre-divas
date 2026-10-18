import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton, SubmitButton } from "@/components/admin/client-ui";
import { IconWhatsApp } from "@/components/admin/icons";
import { Avatar, PageHeader, Pill, Section, buttonClass, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listStaff } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/labels";
import { money } from "@/lib/money";
import { prettyPhone, waLink } from "@/lib/phone";
import { getSettings } from "@/lib/settings";
import { localDate, localTime, prettyDate, prettyTime, relativeDay } from "@/lib/time";
import { deleteAppointment, rescheduleAppointment, setAppointmentStatus } from "../actions";

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const [row] = await db
    .select({ a: schema.appointments, staffName: schema.staff.name, staffColor: schema.staff.color })
    .from(schema.appointments)
    .leftJoin(schema.staff, eq(schema.staff.id, schema.appointments.staffId))
    .where(eq(schema.appointments.id, id));
  if (!row) notFound();
  const { a } = row;
  const settings = await getSettings();
  const staff = await listStaff({ includeOwner: true });
  const date = localDate(a.startsAt);
  const time = localTime(a.startsAt);
  const total = a.items.reduce((s, i) => s + i.price, 0);
  const st = STATUS_LABEL[a.status];
  const first = a.clientName.split(" ")[0];
  const canEdit = user.role === "owner" || a.staffId === user.id;

  const confirmMsg = `Hola ${first} 💛 Te confirmamos tu cita en *Siempre Divas* el ${prettyDate(date)} a las ${prettyTime(time)} para ${a.items.map((i) => i.name).join(", ")}${row.staffName ? ` con ${row.staffName}` : ""}. 📍 ${settings.address}, ${settings.city}. ${settings.bookingPolicy}`;
  const reminderMsg = `Hola ${first} ✨ Te recordamos tu cita en *Siempre Divas* ${relativeDay(date).toLowerCase()} a las ${prettyTime(time)}. ¿Nos confirmas tu asistencia? 💅`;

  const statusForm = (status: string, label: string, variant: "primary" | "secondary" | "danger" | "ok" = "secondary") => (
    <form action={setAppointmentStatus}>
      <input type="hidden" name="id" value={a.id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant={variant} size="lg" pendingText="…">
        {label}
      </SubmitButton>
    </form>
  );

  return (
    <>
      <PageHeader title={a.clientName} back={`/admin/agenda?d=${date}`} subtitle={<Pill tone={st.tone}>{st.label}</Pill>} />

      <div className="mx-4 rounded-3xl bg-surface p-5 lg:mx-0">
        <p className="text-[15px] text-muted">{relativeDay(date)}</p>
        <p className="tabular text-[26px] leading-tight font-bold">
          {prettyTime(time)} – {prettyTime(localTime(a.endsAt))}
        </p>
        <ul className="mt-4 space-y-1.5">
          {a.items.map((i, idx) => (
            <li key={idx} className="flex justify-between text-[16px]">
              <span>{i.name}</span>
              <span className="tabular text-muted">{money(i.price)}</span>
            </li>
          ))}
          <li className="flex justify-between pt-1 text-[16px] font-semibold">
            <span>Total aproximado</span>
            <span className="tabular">{money(total)}</span>
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[15px]">
          {row.staffName && (
            <span className="inline-flex items-center gap-2">
              <Avatar name={row.staffName} color={row.staffColor ?? "#999"} size={28} /> {row.staffName}
            </span>
          )}
          {a.clientPhone && <span className="text-muted">{prettyPhone(a.clientPhone)}</span>}
          {a.source === "web" && <Pill tone="gold">Reservó desde la web</Pill>}
        </div>
        {a.notes && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-[15px]">{a.notes}</p>}
      </div>

      <div className="mt-4 grid gap-2 px-4 lg:px-0">
        {a.status === "pendiente" && canEdit && statusForm("confirmada", "Confirmar cita", "primary")}
        {a.clientPhone && (
          <div className="grid grid-cols-2 gap-2">
            <a href={waLink(a.clientPhone, confirmMsg)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
              <IconWhatsApp width={20} height={20} /> Confirmación
            </a>
            <a href={waLink(a.clientPhone, reminderMsg)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
              <IconWhatsApp width={20} height={20} /> Recordatorio
            </a>
          </div>
        )}
        {user.role === "owner" && (a.status === "confirmada" || a.status === "pendiente") && (
          <Link href={`/admin/caja?cita=${a.id}`} className={buttonClass("ok", "lg")}>
            Atendida: cobrar {money(total)}
          </Link>
        )}
        {a.ticketId && <p className="px-1 text-[14px] text-muted">Cobrada en el ticket #{a.ticketId}.</p>}
        {canEdit && (a.status === "confirmada" || a.status === "pendiente") && (
          <div className="grid grid-cols-2 gap-2">
            {statusForm("no_asistio", "No vino", "danger")}
            {statusForm("cancelada", "Cancelar", "secondary")}
          </div>
        )}
        {canEdit && (a.status === "cancelada" || a.status === "no_asistio") && statusForm("confirmada", "Reactivar cita")}
      </div>

      {canEdit && (a.status === "confirmada" || a.status === "pendiente") && (
        <Section title="Cambiar fecha u hora" className="mt-8">
          <form action={rescheduleAppointment} className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-3">
            <input type="hidden" name="id" value={a.id} />
            <input type="date" name="date" defaultValue={date} className={inputClass} required aria-label="Fecha" />
            <input type="time" name="time" defaultValue={time} step={300} className={inputClass} required aria-label="Hora" />
            <select name="staffId" defaultValue={a.staffId ?? ""} className={`${inputClass} col-span-2`} aria-label="Quién atiende">
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  Con {s.name}
                </option>
              ))}
            </select>
            <div className="col-span-2">
              <SubmitButton size="md">Guardar cambio</SubmitButton>
            </div>
          </form>
        </Section>
      )}

      {(user.role === "owner" || a.createdById === user.id) && (
        <form action={deleteAppointment} className="mt-8 px-4 lg:px-0">
          <input type="hidden" name="id" value={a.id} />
          <ConfirmButton message="¿Borrar esta cita para siempre?" className={buttonClass("ghost", "md", "w-full text-bad")}>
            Borrar cita
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
