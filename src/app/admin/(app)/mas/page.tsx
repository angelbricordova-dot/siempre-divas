import Link from "next/link";
import { ownerMenu } from "@/components/admin/nav";
import { IconLogout } from "@/components/admin/icons";
import { Chevron, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logout } from "../../login/actions";
import { PushToggle } from "@/components/admin/push-toggle";

export const metadata = { title: "Más" };

export default async function MasPage() {
  const user = await requireUser();
  const items = user.role === "owner" ? ownerMenu : [];
  return (
    <>
      <PageHeader title="Más" subtitle={`Sesión de ${user.name}`} />
      <div className="space-y-4 px-4 lg:px-0">
        {items.length > 0 && (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {items.map((m) => {
              const Icon = m.icon;
              return (
                <li key={m.href}>
                  <Link href={m.href} className="flex h-14 items-center gap-3 px-4 text-[16px] hover-lift">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold">
                      <Icon width={20} height={20} />
                    </span>
                    <span className="flex-1 font-medium">{m.label}</span>
                    <Chevron />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <PushToggle />
        <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
          <li>
            <a href="/" target="_blank" className="flex h-14 items-center gap-3 px-4 text-[16px] hover-lift">
              <span className="flex-1 font-medium">Ver la página web</span>
              <Chevron />
            </a>
          </li>
          <li>
            <form action={logout}>
              <button className="flex h-14 w-full items-center gap-3 px-4 text-left text-[16px] font-medium text-bad hover-lift">
                <IconLogout width={20} height={20} /> Cerrar sesión
              </button>
            </form>
          </li>
        </ul>
        <p className="px-1 text-[13px] text-muted">
          Consejo: en el celular abre el menú del navegador y elige “Agregar a pantalla de inicio” para usarla como app.
        </p>
      </div>
    </>
  );
}
