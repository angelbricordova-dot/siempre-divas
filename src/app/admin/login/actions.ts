"use server";

import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { endSession, startSession } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export async function login(_: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!username || !password) return { error: "Escribe tu usuario y tu clave." };
  await ensureDatabase();
  const [user] = await db
    .select()
    .from(schema.staff)
    .where(eq(sql`lower(${schema.staff.username})`, username));
  const valid = user?.passwordHash && user.active && (await bcrypt.compare(password, user.passwordHash));
  if (!user || !valid) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Usuario o clave incorrectos." };
  }
  await startSession({ id: user.id, role: user.role, name: user.name });
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}
