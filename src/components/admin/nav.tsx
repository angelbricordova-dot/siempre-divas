"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";
import {
  IconCalendar,
  IconCash,
  IconChart,
  IconGlobe,
  IconGrid,
  IconHome,
  IconPlus,
  IconReceipt,
  IconScissors,
  IconSettings,
  IconUsers,
  IconWallet,
} from "./icons";

type Role = "owner" | "staff";

const ownerTabs = [
  { href: "/admin", label: "Inicio", icon: IconHome, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/admin/caja", label: "Cobrar", icon: IconPlus, primary: true },
  { href: "/admin/cuentas", label: "Cuentas", icon: IconWallet },
  { href: "/admin/mas", label: "Más", icon: IconGrid },
];

const staffTabs = [
  { href: "/admin", label: "Inicio", icon: IconHome, exact: true },
  { href: "/admin/agenda", label: "Agenda", icon: IconCalendar },
  { href: "/admin/registrar", label: "Registrar", icon: IconPlus, primary: true },
  { href: "/admin/mis-ganancias", label: "Ganancias", icon: IconWallet },
  { href: "/admin/mas", label: "Más", icon: IconGrid },
];

export const ownerMenu = [
  { href: "/admin/ventas", label: "Ventas del día", icon: IconReceipt },
  { href: "/admin/cierre", label: "Cierre de caja", icon: IconCash },
  { href: "/admin/clientes", label: "Clientas", icon: IconUsers },
  { href: "/admin/gastos", label: "Gastos", icon: IconReceipt },
  { href: "/admin/reportes", label: "Reportes", icon: IconChart },
  { href: "/admin/servicios", label: "Servicios y precios", icon: IconScissors },
  { href: "/admin/equipo", label: "Equipo", icon: IconUsers },
  { href: "/admin/web", label: "Trabajos y promos", icon: IconGlobe },
  { href: "/admin/ajustes", label: "Ajustes", icon: IconSettings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const tabs = role === "owner" ? ownerTabs : staffTabs;
  return (
    <nav
      aria-label="Navegación principal"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 bg-surface/95 backdrop-blur-md lg:hidden"
      style={{ boxShadow: "0 -1px 0 var(--surface-2)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((t) => {
          const active = isActive(pathname, t.href, t.exact);
          const Icon = t.icon;
          if (t.primary) {
            return (
              <li key={t.href} className="flex justify-center">
                <Link
                  href={t.href}
                  className="press -mt-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gold text-on-gold"
                  style={{ boxShadow: "0 6px 16px rgba(154,116,49,.35)" }}
                >
                  <Icon width={26} height={26} strokeWidth={2.4} />
                  <span className="text-[11px] font-semibold">{t.label}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "press flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-gold" : "text-muted",
                )}
              >
                <Icon width={24} height={24} strokeWidth={active ? 2.3 : 1.9} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const tabs = (role === "owner" ? ownerTabs : staffTabs).filter((t) => t.href !== "/admin/mas");
  const extra = role === "owner" ? ownerMenu : [];
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col bg-surface px-3 py-6 lg:flex">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal-ink.svg" alt="Siempre Divas" className="mb-6 ml-3 w-40 dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal-gold.svg" alt="Siempre Divas" className="mb-6 ml-3 hidden w-40 dark:block" />
      <ul className="space-y-0.5">
        {[...tabs, ...extra].map((t) => {
          const active = isActive(pathname, t.href, "exact" in t ? Boolean(t.exact) : false);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cx(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium",
                  active ? "bg-gold-soft text-gold" : "text-ink hover-lift",
                )}
              >
                <Icon width={20} height={20} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto px-3 text-[13px] text-muted">Sesión de {name}</p>
    </aside>
  );
}
