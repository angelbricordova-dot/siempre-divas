// Todo el dinero se guarda en centavos.

export function toCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", ".").replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function money(cents: number, opts: { sign?: boolean } = {}): string {
  const abs = Math.abs(cents) / 100;
  const str = abs.toLocaleString("es-EC", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const sign = cents < 0 ? "−" : opts.sign && cents > 0 ? "+" : "";
  return `${sign}$${str}`;
}

export function moneyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

/** Reparte el monto entre trabajadora y salón según el porcentaje. */
export function splitCommission(netPrice: number, pct: number) {
  const staffAmount = Math.round((netPrice * pct) / 100);
  return { staffAmount, salonAmount: netPrice - staffAmount };
}

/** Reparte un descuento entre ítems de forma proporcional, sin perder centavos. */
export function distributeDiscount(prices: number[], discount: number): number[] {
  const subtotal = prices.reduce((a, b) => a + b, 0);
  if (discount <= 0 || subtotal <= 0) return [...prices];
  const d = Math.min(discount, subtotal);
  const shares = prices.map((p) => Math.floor((p * d) / subtotal));
  let rest = d - shares.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0 && i < shares.length; i++) {
    if (prices[i] - shares[i] > 0) {
      shares[i] += 1;
      rest -= 1;
    }
  }
  return prices.map((p, i) => p - shares[i]);
}
