import { PageHeader, Section } from "@/components/ui";
import { PushToggle } from "@/components/admin/push-toggle";
import { requireOwner } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { BusinessForm, NotificationsForm, PasswordForm } from "./forms";

export const metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  await requireOwner();
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Ajustes" back="/admin/mas" />
      <div className="space-y-8">
        <Section title="Avisos a tu WhatsApp">
          <p className="mb-3 text-[15px] text-muted">
            Cada vez que alguien reserve en la web o el equipo agende o envíe algo a caja, te llega un WhatsApp a tu número personal.
          </p>
          <div className="rounded-2xl bg-surface p-4">
            <NotificationsForm s={s} />
          </div>
          <div className="mt-2">
            <PushToggle />
          </div>
        </Section>
        <Section title="El salón">
          <div className="rounded-2xl bg-surface p-4">
            <BusinessForm s={s} />
          </div>
        </Section>
        <Section title="Tu clave">
          <div className="rounded-2xl bg-surface p-4">
            <PasswordForm />
          </div>
        </Section>
      </div>
    </>
  );
}
