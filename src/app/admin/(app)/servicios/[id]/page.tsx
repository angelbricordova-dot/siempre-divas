import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton } from "@/components/admin/client-ui";
import { PageHeader, Section, buttonClass } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { deleteService } from "../actions";
import { ServiceForm } from "../service-form";

export default async function ServicioPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cat?: string }> }) {
  await requireOwner();
  const { id } = await params;
  const sp = await searchParams;
  const categories = await db.select().from(schema.serviceCategories).orderBy(schema.serviceCategories.sort);
  const isNew = id === "nuevo";
  const [service] = isNew ? [] : await db.select().from(schema.services).where(eq(schema.services.id, Number(id)));
  if (!isNew && !service) notFound();
  return (
    <>
      <PageHeader title={isNew ? "Nuevo servicio" : service.name} back="/admin/servicios" />
      <Section>
        <div className="rounded-2xl bg-surface p-4">
          <ServiceForm service={service} categories={categories} defaultCategory={Number(sp.cat) || categories[0]?.id} />
        </div>
      </Section>
      {!isNew && (
        <form action={deleteService} className="mt-6 px-4 lg:px-0">
          <input type="hidden" name="id" value={service.id} />
          <ConfirmButton message="¿Borrar este servicio? Mejor apágalo si ya lo cobraste antes." className={buttonClass("ghost", "md", "w-full text-bad")}>
            Borrar servicio
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
