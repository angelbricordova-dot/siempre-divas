import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export type CurrentUser = {
  id: number;
  name: string;
  role: "owner" | "staff";
  commissionPct: number;
  color: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;
  const [row] = await db.select().from(schema.staff).where(eq(schema.staff.id, session.uid));
  if (!row || !row.active || !row.passwordHash) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    commissionPct: row.commissionPct,
    color: row.color,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireOwner(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "owner") redirect("/admin");
  return user;
}

/** Para Server Actions: lanza error en vez de redirigir. */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Tu sesión expiró. Vuelve a ingresar.");
  return user;
}

export async function assertOwner(): Promise<CurrentUser> {
  const user = await assertUser();
  if (user.role !== "owner") throw new Error("Solo la dueña puede hacer esto.");
  return user;
}

export async function startSession(user: { id: number; role: "owner" | "staff"; name: string }) {
  const token = await signSession({ uid: user.id, role: user.role, name: user.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
