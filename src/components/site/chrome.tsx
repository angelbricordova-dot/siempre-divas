import Link from "next/link";
import type { Settings } from "@/db/schema";
import { prettyPhone, waLink } from "@/lib/phone";

const NAV = [
  { href: "/trabajos", label: "Trabajos" },
  { href: "/#precios", label: "Precios" },
  { href: "/#equipo", label: "Equipo" },
  { href: "/#contacto", label: "Contacto" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-4 px-[var(--margin)] py-3">
        <Link href="/" aria-label="Siempre Divas, inicio" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-horizontal-deep.svg" alt="Siempre Divas" className="h-9 w-auto sm:h-10" />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="link text-[16px]">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/reservar" className="btn min-h-11 px-5 text-[15px]">
          Reservar
        </Link>
      </div>
      <nav aria-label="Secciones" className="no-scrollbar flex gap-2 overflow-x-auto px-[var(--margin)] pb-3 md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="chip h-9 shrink-0 rounded-full bg-[var(--ground-3)] px-4 text-[15px] leading-9">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: Settings }) {
  return (
    <footer className="bg-[var(--ground-2)] px-[var(--margin)] pt-16 pb-28 md:pb-10">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-deep.svg" alt="Siempre Divas, salón de belleza" className="w-56" />
        </div>
        <div className="grid grid-cols-2 gap-8 text-[16px] md:col-span-7 md:grid-cols-3">
          <div>
            <p className="text-[14px] text-[var(--gold-deep)]">Visítanos</p>
            <p>{settings.address}</p>
            <p className="text-[var(--ink-soft)]">{settings.city}</p>
          </div>
          <div>
            <p className="text-[14px] text-[var(--gold-deep)]">Página</p>
            <p><Link href="/trabajos" className="link">Trabajos</Link></p>
            <p><Link href="/#precios" className="link">Precios</Link></p>
            <p><Link href="/reservar" className="link">Reservar</Link></p>
          </div>
          <div>
            <p className="text-[14px] text-[var(--gold-deep)]">Síguenos</p>
            <p><a href={settings.instagram} target="_blank" rel="noreferrer" className="link">Instagram</a></p>
            <p><a href={settings.tiktok} target="_blank" rel="noreferrer" className="link">TikTok</a></p>
            <p><a href={waLink(settings.whatsapp)} target="_blank" rel="noreferrer" className="link">{prettyPhone(settings.whatsapp)}</a></p>
          </div>
        </div>
      </div>
      <div className="mt-14 flex justify-between text-[14px] text-[var(--ink-soft)]">
        <span>© {new Date().getFullYear()} Siempre Divas · Guayaquil</span>
        <Link href="/admin" className="link">Acceso equipo</Link>
      </div>
    </footer>
  );
}
