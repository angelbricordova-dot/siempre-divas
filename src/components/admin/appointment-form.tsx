"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAppointment } from "@/app/admin/(app)/agenda/actions";
import { cx, inputClass } from "@/components/ui";
import { money } from "@/lib/money";
import { prettyTime } from "@/lib/time";
import type { TFCategory, TFClient, TFStaff } from "./ticket-form";

type Slot = { time: string; staffIds: number[] };

export function AppointmentForm({
  staff,
  catalog,
  clients,
  role,
  currentUserId,
  defaultDate,
}: {
  staff: TFStaff[];
  catalog: TFCategory[];
  clients: TFClient[];
  role: "owner" | "staff";
  currentUserId: number;
  defaultDate: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<number[]>([]);
  const [category, setCategory] = useState<number>(catalog[0]?.id ?? 0);
  const [staffId, setStaffId] = useState<number | null>(role === "staff" ? currentUserId : null);
  const [date, setDate] = useState(defaultDate);
  const [result, setResult] = useState<{ key: string; slots: Slot[] } | null>(null);
  const [time, setTime] = useState("");
  const [manual, setManual] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const services = useMemo(() => catalog.flatMap((c) => c.services), [catalog]);
  const chosen = selected.map((id) => services.find((s) => s.id === id)!).filter(Boolean);
  const total = chosen.reduce((a, s) => a + s.price, 0);

  const slotKey = selected.length && date ? `${date}|${selected.join(",")}|${staffId ?? ""}` : "";
  const slots = result && result.key === slotKey ? result.slots : null;

  useEffect(() => {
    if (!slotKey) return;
    const ctrl = new AbortController();
    const p = new URLSearchParams({ date, services: selected.join(","), admin: "1" });
    if (staffId) p.set("staff", String(staffId));
    fetch(`/api/slots?${p}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setResult({ key: slotKey, slots: d.slots ?? [] }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [slotKey, selected, date, staffId]);

  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    if (q.length < 2 || clientId) return [];
    return clients.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 5);
  }, [name, clients, clientId]);

  function toggle(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setTime("");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await saveAppointment({
        date,
        time,
        serviceIds: selected,
        staffId,
        client: { id: clientId, name, phone },
        notes: notes || null,
        allowOverlap: manual,
      });
      if (res.ok) router.push(`/admin/agenda/${res.id}`);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-6 px-4 pb-10 lg:px-0">
      <section>
        <p className="mb-2 text-[15px] font-medium text-muted">1. Servicios</p>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {catalog.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={cx("press h-10 shrink-0 rounded-full px-4 text-[15px] font-medium", category === c.id ? "bg-gold text-on-gold" : "bg-surface")}
            >
              {c.name}
            </button>
          ))}
        </div>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {catalog
            .find((c) => c.id === category)
            ?.services.map((s) => {
              const on = selected.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={on}
                    className={cx(
                      "press flex min-h-13 w-full items-center justify-between gap-2 rounded-2xl px-4 py-2 text-left text-[16px]",
                      on ? "bg-ink text-bg" : "bg-surface",
                    )}
                  >
                    {s.name}
                    <span className="tabular text-[14px] opacity-70">{money(s.price)}</span>
                  </button>
                </li>
              );
            })}
        </ul>
        {chosen.length > 0 && (
          <p className="mt-2 text-[14px] text-muted">
            {chosen.map((c) => c.name).join(" + ")} · {money(total)}
          </p>
        )}
      </section>

      <section>
        <p className="mb-2 text-[15px] font-medium text-muted">2. ¿Con quién?</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setStaffId(null);
              setTime("");
            }}
            className={cx("press h-11 rounded-full px-4 text-[15px] font-medium", staffId === null ? "bg-ink text-bg" : "bg-surface")}
          >
            Quien esté libre
          </button>
          {staff.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setStaffId(s.id);
                setTime("");
              }}
              className={cx("press inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium", staffId === s.id ? "bg-ink text-bg" : "bg-surface")}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              {s.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-[15px] font-medium text-muted">3. Día y hora</p>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className={inputClass} aria-label="Fecha" />
        {!selected.length ? (
          <p className="mt-2 text-[14px] text-muted">Elige un servicio para ver los horarios libres.</p>
        ) : manual ? (
          <input type="time" value={time} step={300} onChange={(e) => setTime(e.target.value)} className={`${inputClass} mt-2`} aria-label="Hora" />
        ) : slots === null ? (
          <p className="mt-2 text-[14px] text-muted">Buscando horarios…</p>
        ) : slots.length === 0 ? (
          <p className="mt-2 rounded-xl bg-warn-soft p-3 text-[15px] text-warn">No hay horarios libres ese día.</p>
        ) : (
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {slots.map((s) => (
              <button
                key={s.time}
                type="button"
                onClick={() => setTime(s.time)}
                className={cx("press tabular h-11 rounded-xl text-[15px] font-medium", time === s.time ? "bg-gold text-on-gold" : "bg-surface")}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
        {role === "owner" && selected.length > 0 && (
          <button type="button" onClick={() => setManual((m) => !m)} className="press mt-2 h-10 text-[14px] font-semibold text-gold">
            {manual ? "Ver horarios libres" : "Poner otra hora (aunque se cruce)"}
          </button>
        )}
      </section>

      <section className="space-y-2">
        <p className="text-[15px] font-medium text-muted">4. Clienta</p>
        <div className="relative">
          <input value={name} onChange={(e) => { setName(e.target.value); setClientId(null); }} placeholder="Nombre" className={inputClass} autoComplete="off" />
          {matches.length > 0 && (
            <ul className="absolute inset-x-0 top-13 z-10 overflow-hidden rounded-xl bg-surface shadow-lg">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between px-4 text-left text-[16px] hover-lift"
                    onClick={() => { setClientId(c.id); setName(c.name); setPhone(c.phone ?? ""); }}
                  >
                    {c.name}
                    <span className="text-[14px] text-muted">{c.phone ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" inputMode="tel" className={inputClass} />
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota (opcional)" className={inputClass} />
      </section>

      {error && <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] text-bad">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || !selected.length || !time || name.trim().length < 2}
        className="press h-14 w-full rounded-2xl bg-gold text-[17px] font-bold text-on-gold disabled:opacity-40"
      >
        {pending ? "Guardando…" : time ? `Agendar a las ${prettyTime(time)}` : "Agendar"}
      </button>
    </div>
  );
}
