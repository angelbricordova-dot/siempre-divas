import { PageHeader, Section } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ClientForm } from "../client-form";

export const metadata = { title: "Nueva clienta" };

export default async function NuevaClientaPage() {
  await requireUser();
  return (
    <>
      <PageHeader title="Nueva clienta" back="/admin/clientes" />
      <Section>
        <div className="rounded-2xl bg-surface p-4">
          <ClientForm />
        </div>
      </Section>
    </>
  );
}
