import { redirect } from "next/navigation";
import { TicketForm } from "@/components/admin/ticket-form";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fullName } from "@/lib/staff-name";
import { listCatalog, listClientsLite, listStaff } from "@/lib/data";

export const metadata = { title: "Registrar servicio" };

export default async function RegistrarPage() {
  const user = await requireUser();
  if (user.role === "owner") redirect("/admin/caja");
  const [staff, catalog, clients] = await Promise.all([listStaff(), listCatalog({ onlyActive: true }), listClientsLite()]);
  return (
    <>
      <PageHeader title="Registrar servicio" subtitle="Anota lo que hiciste y envíalo a caja. Minerva cobra." />
      <TicketForm
        staff={staff.map((s) => ({ id: s.id, name: fullName(s), color: s.color, commissionPct: s.commissionPct, role: s.role }))}
        catalog={catalog.map((c) => ({
          id: c.id,
          name: c.name,
          services: c.services.map((s) => ({ id: s.id, name: s.name, price: s.price, priceFrom: s.priceFrom, commissionPct: s.commissionPct })),
        }))}
        clients={clients}
        role="staff"
        currentUserId={user.id}
      />
    </>
  );
}
