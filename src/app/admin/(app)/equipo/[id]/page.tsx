import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, Section } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { StaffForm } from "../staff-form";

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const categories = await db.select({ id: schema.serviceCategories.id, name: schema.serviceCategories.name }).from(schema.serviceCategories).orderBy(schema.serviceCategories.sort);
  const isNew = id === "nuevo";
  const [staff] = isNew ? [] : await db.select().from(schema.staff).where(eq(schema.staff.id, Number(id)));
  if (!isNew && !staff) notFound();
  return (
    <>
      <PageHeader title={isNew ? "Nueva integrante" : staff.name} back="/admin/equipo" />
      <Section>
        <div className="rounded-2xl bg-surface p-4">
          <StaffForm staff={staff} categories={categories} />
        </div>
      </Section>
    </>
  );
}
