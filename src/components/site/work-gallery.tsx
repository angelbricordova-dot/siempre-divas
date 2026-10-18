"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/components/ui";

export type Work = { id: number; alt: string | null; categoryId: number | null; staffName: string | null };
export type WorkCategory = { id: number; name: string };

/** Galería de trabajos con filtros por tipo y visor a pantalla completa. */
export function WorkGallery({
  works,
  categories,
  limit,
  initialCategory,
}: {
  works: Work[];
  categories: WorkCategory[];
  limit?: number;
  initialCategory?: number | null;
}) {
  const [cat, setCat] = useState<number | null>(initialCategory ?? null);
  const [open, setOpen] = useState<number | null>(null);
  const used = useMemo(() => categories.filter((c) => works.some((w) => w.categoryId === c.id)), [categories, works]);
  const filtered = useMemo(() => (cat ? works.filter((w) => w.categoryId === cat) : works), [works, cat]);
  const shown = limit ? filtered.slice(0, limit) : filtered;
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? null;

  return (
    <div>
      {used.length > 1 && (
        <div className="no-scrollbar -mx-[var(--margin)] flex gap-2 overflow-x-auto px-[var(--margin)] pb-1" role="tablist" aria-label="Filtrar trabajos">
          {[{ id: null as number | null, name: "Todos" }, ...used].map((c) => (
            <button
              key={c.id ?? "all"}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cx(
                "chip h-11 shrink-0 rounded-full px-5 text-[16px]",
                cat === c.id ? "bg-[var(--ink)] text-white" : "bg-[var(--ground-3)] text-[var(--ink)]",
              )}
            >
              {c.name}
              <span className={cx("ml-1.5 text-[14px]", cat === c.id ? "text-white/70" : "text-[var(--ink-soft)]")}>
                {c.id ? works.filter((w) => w.categoryId === c.id).length : works.length}
              </span>
            </button>
          ))}
        </div>
      )}

      <ul className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {shown.map((w, i) => (
          <li key={w.id} className={cx(i === 0 && !limit ? "" : "", "relative")}>
            <button
              type="button"
              onClick={() => setOpen(filtered.indexOf(w))}
              className="work group block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[var(--ground-3)]"
              aria-label={`Ver foto${w.alt ? `: ${w.alt}` : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/media/${w.id}`} alt={w.alt ?? "Trabajo de Siempre Divas"} loading="lazy" className="h-full w-full object-cover" />
            </button>
            {(catName(w.categoryId) || w.staffName) && (
              <p className="mt-1.5 px-1 text-[14px] leading-snug text-[var(--ink-soft)]">
                {catName(w.categoryId)}
                {w.staffName ? ` · por ${w.staffName.split(" ")[0]}` : ""}
              </p>
            )}
          </li>
        ))}
      </ul>

      {open !== null && filtered[open] && (
        <Viewer
          works={filtered}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          catName={catName}
        />
      )}
    </div>
  );
}

function Viewer({
  works,
  index,
  onIndex,
  onClose,
  catName,
}: {
  works: Work[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  catName: (id: number | null) => string | null;
}) {
  const w = works[index];
  const touch = useRef<number | null>(null);
  const go = useCallback((d: number) => onIndex((index + d + works.length) % works.length), [index, works.length, onIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  const cat = catName(w.categoryId);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Trabajo"
      className="viewer fixed inset-0 z-50 flex flex-col bg-white"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <p className="tabular text-[15px] text-[var(--ink-soft)]">
          {index + 1} de {works.length}
        </p>
        <button type="button" onClick={onClose} className="chip inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--ground-3)]" aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={w.id} src={`/api/media/${w.id}`} alt={w.alt ?? "Trabajo de Siempre Divas"} className="max-h-full max-w-full rounded-xl object-contain" />
        {works.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="chip absolute top-1/2 left-3 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:flex" aria-label="Anterior">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} className="chip absolute top-1/2 right-3 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 md:flex" aria-label="Siguiente">
              ›
            </button>
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 pb-[max(env(safe-area-inset-bottom),18px)]">
        <div className="min-w-0">
          {w.alt && <p className="text-[17px]">{w.alt}</p>}
          <p className="text-[14px] text-[var(--ink-soft)]">
            {[cat, w.staffName ? `por ${w.staffName}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link href={w.categoryId ? `/reservar?cat=${w.categoryId}` : "/reservar"} className="btn">
          Quiero este estilo
        </Link>
      </div>
    </div>
  );
}
