import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PageHeader, Section } from "@/components/ui";
import { requireOwner } from "@/lib/auth";
import { fullName } from "@/lib/staff-name";
import { StaffForm } from "../staff-form";

export default async function StaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const categories = await db.select({ id: schema.serviceCategories.id, name: schema.serviceCategories.name }).from(schema.serviceCategories).orderBy(schema.serviceCategories.sort);
  const isNew = id === "nuevo";
  const [staff] = isNew ? [] : await db.select().from(schema.staff).where(eq(schema.staff.id, Number(id)));
  if (!isNew && !staff) notFound();
  const others = await db.select({ id: schema.staff.id, color: schema.staff.color, active: schema.staff.active }).from(schema.staff);
  const usedColors = others.filter((o) => o.active && o.id !== staff?.id).map((o) => o.color);
  return (
    <>
      <PageHeader title={isNew ? "Nueva integrante" : fullName(staff)} back="/admin/equipo" />
      <Section>
        <div className="rounded-2xl bg-surface p-4">
          <StaffForm staff={staff} categories={categories} usedColors={usedColors} />
        </div>
      </Section>
    </>
  );
}
