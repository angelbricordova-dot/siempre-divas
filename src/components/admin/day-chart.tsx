"use client";

import { useState } from "react";
import { money } from "@/lib/money";
import { DAY_SHORT, shortDate, weekday } from "@/lib/time";

/** Barras de lo cobrado por día. Una sola serie: el título la nombra, sin leyenda. */
export function DayChart({ data }: { data: { date: string; gross: number; salon: number }[] }) {
  const [active, setActive] = useState<number | null>(null);
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.gross), 1);
  const peak = data.reduce((best, d, i) => (d.gross > data[best].gross ? i : best), 0);
  const H = 160;
  const shown = active ?? peak;
  const d = data[shown];
  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-[14px] text-muted">
          {DAY_SHORT[weekday(d.date)]} {shortDate(d.date)}
          {active === null && data.length > 1 ? " · mejor día" : ""}
        </p>
        <p className="tabular text-[15px]">
          <span className="font-semibold">{money(d.gross)}</span>
          <span className="text-muted"> · salón {money(d.salon)}</span>
        </p>
      </div>
      <div className="relative" style={{ height: H }} onPointerLeave={() => setActive(null)}>
        <div className="absolute inset-x-0 bottom-0 h-px bg-surface-3" aria-hidden />
        <div className="absolute inset-0 flex items-end" style={{ gap: 2 }}>
          {data.map((row, i) => {
            const h = Math.max(2, (row.gross / max) * (H - 8));
            return (
              <button
                key={row.date}
                type="button"
                className="group flex h-full min-w-0 flex-1 items-end justify-center"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-label={`${shortDate(row.date)}: ${money(row.gross)} cobrado, ${money(row.salon)} para el salón`}
              >
                <span
                  className="block w-full transition-opacity"
                  style={{
                    maxWidth: 24,
                    height: h,
                    background: "var(--chart-1)",
                    borderRadius: "4px 4px 0 0",
                    opacity: active === null || active === i ? 1 : 0.45,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
      {data.length > 1 && (
        <div className="tabular mt-1.5 flex justify-between text-[12px] text-muted">
          <span>{shortDate(data[0].date)}</span>
          <span>{shortDate(data[data.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}
