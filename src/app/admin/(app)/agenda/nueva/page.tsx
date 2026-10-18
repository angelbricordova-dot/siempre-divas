import { AppointmentForm } from "@/components/admin/appointment-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listCatalog, listClientsLite, listStaff } from "@/lib/data";
import { localDate } from "@/lib/time";

export const metadata = { title: "Nueva cita" };

export default async function NuevaCitaPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [staff, catalog, clients] = await Promise.all([listStaff({ includeOwner: true }), listCatalog({ onlyActive: true }), listClientsLite()]);
  const bookable = staff.filter((s) => s.bookable);
  return (
    <>
      <PageHeader title="Nueva cita" back="/admin/agenda" subtitle={user.role === "staff" ? "Minerva recibirá un aviso." : undefined} />
      <AppointmentForm
        staff={bookable.map((s) => ({ id: s.id, name: s.name, color: s.color, commissionPct: s.commissionPct, role: s.role }))}
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          services: c.services.filter((s) => s.bookable).map((s) => ({ id: s.id, name: s.name, price: s.price, priceFrom: s.priceFrom, commissionPct: s.commissionPct })),
        }))}
        clients={clients}
        role={user.role}
        currentUserId={user.id}
        defaultDate={sp.d ?? localDate()}
      />
    </>
  );
}
