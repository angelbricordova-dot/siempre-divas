import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Firma corta para enlaces públicos (ej. confirmación de una cita). */
export function signId(id: number): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(`appt:${id}`).digest("base64url").slice(0, 16);
}

export function verifyId(id: number, token: string | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(signId(id));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
