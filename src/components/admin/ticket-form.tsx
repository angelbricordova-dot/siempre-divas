"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTicket, type SaveTicketResult } from "@/app/admin/(app)/caja/actions";
import { Avatar, buttonClass, cx, inputClass } from "@/components/ui";
import { distributeDiscount, money, moneyInput, splitCommission, toCents } from "@/lib/money";
import { waLink } from "@/lib/phone";

export type TFStaff = { id: number; name: string; color: string; commissionPct: number; role: "owner" | "staff" };
export type TFCategory = {
  id: number;
  name: string;
  services: { id: number; name: string; price: number; priceFrom: boolean; commissionPct: number | null }[];
};
export type TFClient = { id: number; name: string; phone: string | null };

type Item = { key: string; serviceId: number | null; description: string; staffId: number | null; price: string };

export type TFInitial = {
  ticketId?: number;
  appointmentId?: number;
  items: Omit<Item, "key">[];
  client?: { id?: number | null; name: string; phone?: string | null } | null;
  discount?: number;
  tip?: number;
  tipStaffId?: number | null;
  notes?: string | null;
};

const METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "deuna", label: "De Una" },
  { id: "tarjeta", label: "Tarjeta" },
] as const;

let keySeq = 0;
const newKey = () => `i${++keySeq}`;

export function TicketForm({
  staff,
  catalog,
  clients,
  role,
  currentUserId,
  initial,
}: {
  staff: TFStaff[];
  catalog: TFCategory[];
  clients: TFClient[];
  role: "owner" | "staff";
  currentUserId: number;
  initial?: TFInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveTicketResult | null>(null);
  const isOwner = role === "owner";
  const firstWorker = initial?.items[0]?.staffId ?? (isOwner ? (staff.find((s) => s.role !== "owner")?.id ?? staff[0]?.id ?? null) : currentUserId);

  const [worker, setWorker] = useState<number | null>(firstWorker);
  const [items, setItems] = useState<Item[]>(() => (initial?.items ?? []).map((i) => ({ ...i, key: newKey() })));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<number | "all">(catalog[0]?.id ?? "all");
  const [clientName, setClientName] = useState(initial?.client?.name ?? "");
  const [clientPhone, setClientPhone] = useState(initial?.client?.phone ?? "");
  const [clientId, setClientId] = useState<number | null>(initial?.client?.id ?? null);
  const [showExtras, setShowExtras] = useState(Boolean(initial?.discount || initial?.tip));
  const [discount, setDiscount] = useState(initial?.discount ? moneyInput(initial.discount) : "");
  const [tip, setTip] = useState(initial?.tip ? moneyInput(initial.tip) : "");
  const [method, setMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const serviceById = useMemo(() => {
    const m = new Map<number, TFCategory["services"][number]>();
    catalog.forEach((c) => c.services.forEach((s) => m.set(s.id, s)));
    return m;
  }, [catalog]);

  const visibleServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return catalog.flatMap((c) => c.services).filter((s) => s.name.toLowerCase().includes(q));
    return catalog.find((c) => c.id === category)?.services ?? catalog.flatMap((c) => c.services);
  }, [catalog, category, query]);

  const clientMatches = useMemo(() => {
    const q = clientName.trim().toLowerCase();
    if (q.length < 2 || clientId) return [];
    const digits = q.replace(/\D/g, "");
    return clients
      .filter((c) => c.name.toLowerCase().includes(q) || (digits.length > 3 && c.phone?.includes(digits)))
      .slice(0, 5);
  }, [clientName, clients, clientId]);

  const prices = items.map((i) => toCents(i.price));
  const subtotal = prices.reduce((a, b) => a + b, 0);
  const discountC = Math.min(toCents(discount), subtotal);
  const tipC = toCents(tip);
  const total = subtotal - discountC;

  const split = useMemo(() => {
    const nets = distributeDiscount(prices, discountC);
    const per = new Map<number, number>();
    let salon = 0;
    items.forEach((it, idx) => {
      const w = staff.find((s) => s.id === it.staffId);
      const svc = it.serviceId ? serviceById.get(it.serviceId) : undefined;
      let pct = w && w.role !== "owner" ? w.commissionPct : 0;
      if (w && w.role !== "owner" && svc?.commissionPct != null) pct = svc.commissionPct;
      const { staffAmount, salonAmount } = splitCommission(nets[idx], pct);
      salon += salonAmount;
      if (w && staffAmount > 0) per.set(w.id, (per.get(w.id) ?? 0) + staffAmount);
    });
    return { per, salon };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, discountC, staff, serviceById]);

  function addService(s: TFCategory["services"][number]) {
    setItems((prev) => [
      ...prev,
      { key: newKey(), serviceId: s.id, description: s.name, staffId: worker, price: moneyInput(s.price) },
    ]);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
  }

  function addCustom() {
    setItems((prev) => [...prev, { key: newKey(), serviceId: null, description: "", staffId: worker, price: "" }]);
  }

  function update(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function reset() {
    setResult(null);
    setItems([]);
    setClientName("");
    setClientPhone("");
    setClientId(null);
    setDiscount("");
    setTip("");
    setNotes("");
    setMethod(null);
    setShowExtras(false);
    setQuery("");
  }

  function submit(mode: "charge" | "pending") {
    setResult(null);
    startTransition(async () => {
      const res = await saveTicket({
        ticketId: initial?.ticketId ?? null,
        appointmentId: initial?.appointmentId ?? null,
        mode,
        items: items.map((i) => ({
          serviceId: i.serviceId,
          description: i.description.trim() || "Servicio",
          staffId: i.staffId,
          price: toCents(i.price),
        })),
        discount: discountC,
        tip: tipC,
        tipStaffId: tipC > 0 ? (items[0]?.staffId ?? null) : null,
        method: mode === "charge" ? (method as (typeof METHODS)[number]["id"]) : null,
        client: clientName.trim() || clientId ? { id: clientId, name: clientName, phone: clientPhone } : undefined,
        notes: notes || null,
      });
      setResult(res);
      if (res.ok) {
        window.scrollTo({ top: 0 });
        router.refresh();
      }
    });
  }

  if (result?.ok) {
    const receipt = [
      `✨ *Siempre Divas* ✨`,
      `Gracias por tu visita${clientName ? `, ${clientName.split(" ")[0]}` : ""}.`,
      ...items.map((i) => `• ${i.description || "Servicio"}: ${money(toCents(i.price))}`),
      discountC ? `Descuento: −${money(discountC)}` : "",
      `*Total: ${money(result.total)}*`,
      `¡Te esperamos pronto! 💅`,
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <div className="animate-rise px-4 pt-6 lg:px-0">
        <div className="rounded-3xl bg-surface p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-4 text-[17px] text-muted">{result.status === "pagado" ? "Cobrado" : "Enviado a caja"}</p>
          <p className="tabular text-[44px] leading-tight font-bold tracking-tight">{money(result.total)}</p>
          {result.status === "pagado" ? (
            <ul className="mt-4 space-y-1.5 text-left">
              {result.split.map((s) => (
                <li key={s.name} className="flex justify-between rounded-xl bg-surface-2 px-4 py-3 text-[16px]">
                  <span>Para {s.name}</span>
                  <span className="tabular font-semibold">{money(s.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between rounded-xl bg-gold-soft px-4 py-3 text-[16px] text-gold">
                <span>Para el salón</span>
                <span className="tabular font-semibold">{money(result.salon)}</span>
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-[15px] text-muted">Minerva lo verá en “Por cobrar” y recibirá un aviso.</p>
          )}
        </div>
        <div className="mt-4 grid gap-2">
          {result.status === "pagado" && clientPhone && (
            <a href={waLink(clientPhone, receipt)} target="_blank" rel="noreferrer" className={buttonClass("secondary", "lg")}>
              Enviar recibo por WhatsApp
            </a>
          )}
          <Link href={isOwner ? "/admin/caja" : "/admin/registrar"} className={buttonClass("primary", "lg")} onClick={reset}>
            {isOwner ? "Nuevo cobro" : "Registrar otro servicio"}
          </Link>
          <Link href="/admin" className={buttonClass("ghost", "md")}>
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = items.length > 0 && items.every((i) => toCents(i.price) >= 0 && i.price !== "") && !pending;

  return (
    <div className="pb-40">
      {isOwner && (
        <div className="px-4 lg:px-0">
          <p className="mb-2 text-[15px] font-medium text-muted">¿Quién atendió?</p>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
            {staff.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setWorker(s.id);
                  setItems((prev) => prev.map((i) => (prev.length === 1 ? { ...i, staffId: s.id } : i)));
                }}
                className={cx(
                  "press flex h-14 shrink-0 items-center gap-2 rounded-2xl pr-4 pl-2 text-[16px] font-medium",
                  worker === s.id ? "bg-ink text-bg" : "bg-surface text-ink",
                )}
              >
                <Avatar name={s.name} color={s.color} size={36} />
                {s.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-5 px-4 lg:px-0">
          <p className="mb-2 text-[15px] font-medium text-muted">Ticket</p>
          <ul className="space-y-2">
            {items.map((it) => {
              const w = staff.find((s) => s.id === it.staffId);
              return (
                <li key={it.key} className="animate-rise rounded-2xl bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={it.description}
                      onChange={(e) => update(it.key, { description: e.target.value })}
                      placeholder="¿Qué se hizo?"
                      className="h-11 min-w-0 flex-1 rounded-lg bg-transparent px-1 text-[16px] font-medium outline-none focus:bg-surface-2"
                      aria-label="Descripción"
                    />
                    <div className="flex h-11 items-center rounded-xl bg-surface-2 pl-3">
                      <span className="text-muted">$</span>
                      <input
                        value={it.price}
                        onChange={(e) => update(it.key, { price: e.target.value })}
                        inputMode="decimal"
                        placeholder="0"
                        className="tabular h-11 w-20 bg-transparent px-1.5 text-right text-[18px] font-semibold outline-none"
                        aria-label="Precio"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((i) => i.key !== it.key))}
                      className="press inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted"
                      aria-label="Quitar"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  {isOwner && staff.length > 1 && (
                    <label className="mt-1 flex items-center gap-2 px-1 text-[14px] text-muted">
                      {w && <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} />}
                      Lo hizo
                      <select
                        value={it.staffId ?? ""}
                        onChange={(e) => update(it.key, { staffId: e.target.value ? Number(e.target.value) : null })}
                        className="h-9 rounded-lg bg-surface-2 px-2 text-[15px] text-ink"
                      >
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                        <option value="">Venta del salón (producto)</option>
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-5 px-4 lg:px-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[15px] font-medium text-muted">Agregar servicio</p>
          <button type="button" onClick={addCustom} className="press h-9 rounded-lg px-2 text-[15px] font-semibold text-gold">
            + Monto libre
          </button>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar: uñas, tinte, cejas…"
          className={inputClass}
          type="search"
        />
        {!query && (
          <div className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
            {catalog.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cx(
                  "press h-10 shrink-0 rounded-full px-4 text-[15px] font-medium",
                  category === c.id ? "bg-gold text-on-gold" : "bg-surface text-ink",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {visibleServices.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => addService(s)}
                className="press flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-2 text-left"
              >
                <span className="text-[16px] leading-snug">{s.name}</span>
                <span className="tabular shrink-0 text-[15px] font-semibold text-muted">
                  {s.priceFrom ? "desde " : ""}
                  {money(s.price)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 space-y-3 px-4 lg:px-0">
        <p className="text-[15px] font-medium text-muted">Clienta (opcional)</p>
        <div className="relative">
          <input
            value={clientName}
            onChange={(e) => {
              setClientName(e.target.value);
              setClientId(null);
            }}
            placeholder="Nombre"
            className={inputClass}
            autoComplete="off"
          />
          {clientMatches.length > 0 && (
            <ul className="absolute inset-x-0 top-13 z-10 overflow-hidden rounded-xl bg-surface shadow-lg">
              {clientMatches.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-between px-4 text-left text-[16px] hover-lift"
                    onClick={() => {
                      setClientId(c.id);
                      setClientName(c.name);
                      setClientPhone(c.phone ?? "");
                    }}
                  >
                    {c.name}
                    <span className="text-[14px] text-muted">{c.phone ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!clientId && clientName.trim().length > 1 && (
          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="WhatsApp (para enviarle el recibo)"
            inputMode="tel"
            className={inputClass}
          />
        )}

        {!showExtras ? (
          <button type="button" onClick={() => setShowExtras(true)} className="press h-11 text-[15px] font-semibold text-gold">
            + Descuento, propina o nota
          </button>
        ) : (
          <div className="animate-rise grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block text-[14px] text-muted">Descuento $</span>
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
            </label>
            <label>
              <span className="mb-1 block text-[14px] text-muted">Propina $</span>
              <input value={tip} onChange={(e) => setTip(e.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
            </label>
            <label className="col-span-2">
              <span className="mb-1 block text-[14px] text-muted">Nota</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: color 7.1, pagó la mitad" className={inputClass} />
            </label>
            {tipC > 0 && <p className="col-span-2 text-[13px] text-muted">La propina es 100 % para quien atendió.</p>}
          </div>
        )}

        {isOwner && (
          <div>
            <p className="mb-2 text-[15px] font-medium text-muted">¿Cómo pagó?</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cx(
                    "press h-13 rounded-xl text-[16px] font-medium",
                    method === m.id ? "bg-ink text-bg" : "bg-surface text-ink",
                  )}
                  aria-pressed={method === m.id}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {result && !result.ok && <p className="rounded-xl bg-bad-soft px-4 py-3 text-[15px] text-bad">{result.error}</p>}
      </div>

      {/* Barra fija con el total y el botón principal */}
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-3 pb-2 lg:bottom-4 lg:left-64">
        <div className="mx-auto max-w-lg rounded-3xl bg-ink p-3 text-bg shadow-2xl lg:max-w-2xl">
          {items.length > 0 && isOwner && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-2 pb-2 text-[13px] opacity-80">
              {[...split.per.entries()].map(([id, amt]) => (
                <span key={id} className="tabular shrink-0">
                  {staff.find((s) => s.id === id)?.name.split(" ")[0]} {money(amt)}
                </span>
              ))}
              <span className="tabular shrink-0">Salón {money(split.salon)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 pl-2">
              <p className="text-[13px] opacity-70">{items.length} servicio{items.length === 1 ? "" : "s"}</p>
              <p className="tabular text-[24px] leading-tight font-bold">{money(total + tipC)}</p>
            </div>
            {isOwner && !initial?.ticketId && (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => submit("pending")}
                className="press h-13 rounded-2xl bg-white/10 px-3 text-[14px] font-semibold disabled:opacity-40"
              >
                Pendiente
              </button>
            )}
            <button
              type="button"
              disabled={!canSubmit || (isOwner && !method)}
              onClick={() => submit(isOwner ? "charge" : "pending")}
              className="press h-13 rounded-2xl bg-brand-gold px-5 text-[17px] font-bold text-brand-black disabled:opacity-40"
            >
              {pending ? "Guardando…" : isOwner ? (method ? "Cobrar" : "Elige el pago") : "Enviar a caja"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
