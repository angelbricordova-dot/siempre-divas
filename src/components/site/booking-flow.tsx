"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookOnline } from "@/app/(site)/reservar/actions";
import { cx } from "@/components/ui";
import { money } from "@/lib/money";
import { MSG } from "@/lib/messages";
import { waLink } from "@/lib/phone";
import { DAY_SHORT, MONTHS, addDays, prettyDate, prettyTime, weekday } from "@/lib/time";

type Svc = { id: number; name: string; price: number; priceFrom: boolean; durationMin: number; categoryId: number };
type Cat = { id: number; name: string; services: Svc[] };
type Person = { id: number; name: string; specialty: string | null; categoryIds: number[]; daysOff: number[] };
type Slot = { time: string; staffIds: number[] };

export function BookingFlow({
  catalog,
  people,
  hours,
  maxDaysAhead,
  today,
  policy,
  whatsapp,
  initialService,
  initialCategory,
  initialDate,
}: {
  catalog: Cat[];
  people: Person[];
  hours: ({ open: string; close: string } | null)[];
  maxDaysAhead: number;
  today: string;
  policy: string;
  whatsapp: string;
  initialService?: number;
  initialCategory?: number;
  initialDate?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const all = useMemo(() => catalog.flatMap((c) => c.services), [catalog]);
  const initialCat =
    all.find((s) => s.id === initialService)?.categoryId ??
    (catalog.some((c) => c.id === initialCategory) ? initialCategory : catalog[0]?.id);
  const [cat, setCat] = useState(initialCat);
  const [selected, setSelected] = useState<number[]>(initialService && all.some((s) => s.id === initialService) ? [initialService] : []);
  const [pickedStaff, setStaffId] = useState<number | null>(null);
  const [date, setDateRaw] = useState(initialDate ?? "");
  const [result, setResult] = useState<{ key: string; slots: Slot[] } | null>(null);
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [trap, setTrap] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chosen = selected.map((id) => all.find((s) => s.id === id)!).filter(Boolean);
  const cats = [...new Set(chosen.map((s) => s.categoryId))];
  const total = chosen.reduce((a, s) => a + s.price, 0);
  const duration = chosen.reduce((a, s) => a + s.durationMin, 0);
  const anyFrom = chosen.some((s) => s.priceFrom);
  const eligible = people.filter((p) => !p.categoryIds.length || cats.every((c) => p.categoryIds.includes(c)));
  // Si la profesional elegida no hace todos los servicios, vuelve a "quien esté libre".
  const staffId = pickedStaff && eligible.some((p) => p.id === pickedStaff) ? pickedStaff : null;
  const slotKey = selected.length && date ? `${date}|${selected.join(",")}|${staffId ?? ""}` : "";
  const slots = result && result.key === slotKey ? result.slots : null;

  function setDate(d: string) {
    setDateRaw(d);
    setTime("");
  }
  const days = Array.from({ length: Math.min(maxDaysAhead, 21) + 1 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (!slotKey) return;
    const ctrl = new AbortController();
    const p = new URLSearchParams({ date, services: selected.join(",") });
    if (staffId) p.set("staff", String(staffId));
    fetch(`/api/slots?${p}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setResult({ key: slotKey, slots: d.slots ?? [] }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [slotKey, date, selected, staffId]);

  const morning = slots?.filter((s) => s.time < "12:00") ?? [];
  const afternoon = slots?.filter((s) => s.time >= "12:00") ?? [];
  const ready = selected.length > 0 && date && time && name.trim().length > 1 && phone.replace(/\D/g, "").length >= 9;

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setTime("");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await bookOnline({ date, time, serviceIds: selected, staffId, name, phone, notes, website: trap });
      if (res.ok) router.push(`/reservar/listo?c=${res.id}&t=${res.token}`);
      else setError(res.error);
    });
  }

  const step = "display text-[clamp(28px,3vw,40px)]";

  return (
    <div className="pb-48">
      <section aria-labelledby="s1" className="px-[var(--margin)]">
        <h2 id="s1" className={step}>¿Qué te hacemos?</h2>
        <div className="no-scrollbar -mx-[var(--margin)] mt-5 flex gap-1.5 overflow-x-auto px-[var(--margin)]">
          {catalog.map((c) => {
            const count = c.services.filter((s) => selected.includes(s.id)).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={cx("chip h-11 shrink-0 rounded-full px-5 text-[16px]", cat === c.id ? "bg-[var(--ink)] text-white" : "bg-[var(--ground-3)]")}
              >
                {c.name}
                {count > 0 && <span className="ml-1.5 text-[var(--gold-deep)]">·{count}</span>}
              </button>
            );
          })}
        </div>
        <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
          {catalog
            .find((c) => c.id === cat)
            ?.services.map((s) => {
              const on = selected.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={on}
                    className={cx(
                      "chip flex min-h-16 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left",
                      on ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ground-2)]",
                    )}
                  >
                    <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[15px]", on ? "bg-[var(--ink)] text-[var(--accent)]" : "bg-white")} aria-hidden>
                      {on && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[16px]">{s.name}</span>
                      <span className={cx("block text-[14px]", on ? "text-[var(--ink)]/70" : "text-[var(--ink-soft)]")}>{s.durationMin} min</span>
                    </span>
                    <span className="tabular text-[16px]">
                      {s.priceFrom && <span className="text-[13px] opacity-70">desde </span>}
                      {money(s.price)}
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      </section>

      <section aria-labelledby="s2" className={cx("mt-16 px-[var(--margin)] transition-opacity", !selected.length && "pointer-events-none opacity-35")}>
        <h2 id="s2" className={step}>¿Con quién?</h2>
        <div className="mt-5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStaffId(null);
              setTime("");
            }}
            className={cx("chip h-12 rounded-full px-5 text-[16px]", staffId === null ? "bg-[var(--ink)] text-white" : "bg-[var(--ground-3)]")}
          >
            Con quien esté libre
          </button>
          {eligible.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setStaffId(p.id);
                setTime("");
              }}
              className={cx("chip min-h-12 rounded-2xl px-5 py-2 text-left text-[16px]", staffId === p.id ? "bg-[var(--ink)] text-white" : "bg-[var(--ground-3)]")}
            >
              {p.name.split(" ")[0]}
              {p.specialty && <span className="block text-[13px] opacity-70">{p.specialty}</span>}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="s3" className={cx("mt-16 transition-opacity", !selected.length && "pointer-events-none opacity-35")}>
        <h2 id="s3" className={cx(step, "px-[var(--margin)]")}>¿Cuándo?</h2>
        <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto px-[var(--margin)]">
          {days.map((d) => {
            const wd = weekday(d);
            const closed = !hours[wd] || (staffId ? people.find((p) => p.id === staffId)?.daysOff.includes(wd) : false);
            return (
              <button
                key={d}
                type="button"
                disabled={closed}
                onClick={() => setDate(d)}
                className={cx(
                  "chip flex h-[76px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl disabled:opacity-30",
                  date === d ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ground-2)]",
                )}
                aria-label={prettyDate(d)}
              >
                <span className="text-[13px] opacity-80">{d === today ? "Hoy" : DAY_SHORT[wd]}</span>
                <span className="tabular text-[22px] leading-tight font-semibold">{Number(d.slice(8))}</span>
                <span className="text-[12px] opacity-70">{MONTHS[Number(d.slice(5, 7)) - 1].slice(0, 3)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 px-[var(--margin)]">
          {!date ? (
            <p className="text-[16px] text-[var(--ink-soft)]">Elige un día para ver las horas libres.</p>
          ) : slots === null ? (
            <p className="text-[16px] text-[var(--ink-soft)]">Buscando horas libres…</p>
          ) : slots.length === 0 ? (
            <p className="rounded-2xl bg-[var(--ground-2)] p-4 text-[16px]">
              Ese día ya está lleno. Prueba otro día o{" "}
              <a className="link text-[var(--gold-deep)]" href={waLink(whatsapp, MSG.dayFull(prettyDate(date)))} target="_blank" rel="noreferrer">
                escríbenos por WhatsApp
              </a>
              .
            </p>
          ) : (
            <div className="space-y-5">
              {[
                ["Mañana", morning],
                ["Tarde", afternoon],
              ].map(([label, list]) =>
                (list as Slot[]).length ? (
                  <div key={label as string}>
                    <p className="mb-2 text-[15px] text-[var(--ink-soft)]">{label as string}</p>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
                      {(list as Slot[]).map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => setTime(s.time)}
                          className={cx("chip tabular h-12 rounded-xl text-[16px]", time === s.time ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[var(--ground-2)]")}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="s4" className={cx("mt-16 px-[var(--margin)] transition-opacity", !time && "pointer-events-none opacity-35")}>
        <h2 id="s4" className={step}>Tus datos</h2>
        <div className="mt-5 grid max-w-xl gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" className="h-14 rounded-xl bg-[var(--ground-2)] px-4 text-[17px] outline-none placeholder:text-[var(--ink-soft)] focus:ring-2 focus:ring-[var(--accent)]" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Tu WhatsApp (09…)" inputMode="tel" autoComplete="tel" className="h-14 rounded-xl bg-[var(--ground-2)] px-4 text-[17px] outline-none placeholder:text-[var(--ink-soft)] focus:ring-2 focus:ring-[var(--accent)]" />
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="¿Algo que debamos saber? (opcional)" className="h-14 rounded-xl bg-[var(--ground-2)] px-4 text-[17px] outline-none placeholder:text-[var(--ink-soft)] focus:ring-2 focus:ring-[var(--accent)]" />
          <input value={trap} onChange={(e) => setTrap(e.target.value)} name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
          <p className="mt-2 text-[15px] text-[var(--ink-soft)]">{policy}</p>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-white px-[var(--margin)] pt-3 pb-[max(env(safe-area-inset-bottom),14px)]" style={{ boxShadow: "0 -1px 0 var(--ground-4)" }}>
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <div className="min-w-0 flex-1">
            {chosen.length ? (
              <>
                <p className="truncate text-[15px]">
                  {chosen.map((c) => c.name).join(" + ")}
                </p>
                <p className="tabular text-[14px] text-[var(--ink-soft)]">
                  {anyFrom ? "desde " : ""}
                  {money(total)} · {duration} min
                  {date && time ? ` · ${DAY_SHORT[weekday(date)]} ${Number(date.slice(8))} a las ${prettyTime(time)}` : ""}
                </p>
              </>
            ) : (
              <p className="text-[15px] text-[var(--ink-soft)]">Elige uno o varios servicios</p>
            )}
            {error && <p className="mt-1 text-[14px] text-[#b3261e]">{error}</p>}
          </div>
          <button type="button" disabled={!ready || pending} onClick={submit} className="btn shrink-0 disabled:opacity-40">
            {pending ? "Reservando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
