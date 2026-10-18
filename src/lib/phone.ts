/** Normaliza un número ecuatoriano a formato internacional sin "+" (593…). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("593")) return d;
  if (d.startsWith("0")) return `593${d.slice(1)}`;
  if (d.length === 9 && d.startsWith("9")) return `593${d}`;
  return d;
}

/** 593964015681 → 096 401 5681 */
export function prettyPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const n = normalizePhone(phone) ?? phone;
  if (n.startsWith("593") && n.length === 12) {
    const local = `0${n.slice(3)}`;
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return phone;
}

export function waLink(phone: string | null | undefined, text?: string): string {
  const n = normalizePhone(phone) ?? "";
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
