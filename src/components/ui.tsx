import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-4 pt-4 pb-3 lg:px-0 lg:pt-8">
      <div className="min-w-0">
        {back && (
          <Link
            href={back}
            className="press -ml-2 mb-1 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[15px] text-gold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver
          </Link>
        )}
        <h1 className="truncate text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("px-4 lg:px-0", className)}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cx("rounded-2xl bg-surface p-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx("divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface", className)}>{children}</ul>;
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "ok";
const btn: Record<BtnVariant, string> = {
  primary: "bg-gold text-on-gold",
  secondary: "bg-surface-2 text-ink",
  ghost: "bg-transparent text-gold",
  danger: "bg-bad-soft text-bad",
  ok: "bg-ok text-white dark:text-black",
};

export function buttonClass(variant: BtnVariant = "primary", size: "md" | "lg" | "sm" = "md", extra?: string) {
  return cx(
    "press inline-flex items-center justify-center gap-2 rounded-xl font-semibold select-none disabled:opacity-50 disabled:pointer-events-none",
    size === "lg" && "h-14 px-5 text-[17px]",
    size === "md" && "h-12 px-4 text-[16px]",
    size === "sm" && "h-9 px-3 text-[14px]",
    btn[variant],
    extra,
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  variant?: BtnVariant;
  size?: "md" | "lg" | "sm";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "ok" | "warn" | "bad" | "gold"; children: ReactNode }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
    gold: "bg-gold-soft text-gold",
  };
  return (
    <span className={cx("inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap", tones[tone])}>
      {children}
    </span>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface px-5 py-8 text-center">
      <p className="text-[16px] font-semibold">{title}</p>
      {children && <div className="mt-1 text-[15px] text-muted">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-[14px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "block h-12 w-full rounded-xl bg-surface-2 px-3.5 text-[16px] text-ink placeholder:text-muted/70 outline-none focus:ring-2 focus:ring-gold";
export const textareaClass =
  "block min-h-24 w-full rounded-xl bg-surface-2 px-3.5 py-3 text-[16px] text-ink placeholder:text-muted/70 outline-none focus:ring-2 focus:ring-gold";

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "gold" | "ok" | "bad" }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-[14px] text-muted">{label}</p>
      <p
        className={cx(
          "tabular mt-1 text-[26px] leading-none font-bold tracking-tight",
          tone === "gold" && "text-gold",
          tone === "ok" && "text-ok",
          tone === "bad" && "text-bad",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export function Chevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-muted/60">
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
