import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "sd_session";
export const SESSION_DAYS = 30;

export type SessionPayload = { uid: number; role: "owner" | "staff"; name: string };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("Define AUTH_SECRET (mínimo 16 caracteres)");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
