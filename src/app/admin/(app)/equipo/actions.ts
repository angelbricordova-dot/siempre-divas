"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { assertOwner } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";

export async function saveStaff(_: unknown, formData: FormData) {
  try {
    await assertOwner();
    const id = Number(formData.get("id")) || null;
    const name = String(formData.get("name") ?? "").trim();
    if (name.length < 2) return { error: "Escribe el nombre." };
    const lastName = String(formData.get("lastName") ?? "").trim() || null;
    const position = String(formData.get("position") ?? "").trim() || null;
    const username = String(formData.get("username") ?? "").trim().toLowerCase() || null;
    const password = String(formData.get("password") ?? "");
    if (username) {
      const [dupe] = await db
        .select({ id: schema.staff.id })
        .from(schema.staff)
        .where(and(eq(sql`lower(${schema.staff.username})`, username), id ? ne(schema.staff.id, id) : undefined));
      if (dupe) return { error: "Ese usuario ya existe." };
    }
    if (password && password.length < 4) return { error: "La clave debe tener al menos 4 caracteres." };
    const values = {
      name,
      lastName,
      position,
      username,
      phone: normalizePhone(String(formData.get("phone") ?? "")),
      commissionPct: Math.min(100, Math.max(0, Number(formData.get("commissionPct")) || 0)),
      color: String(formData.get("color") || "#C9A45C"),
      specialty: String(formData.get("specialty") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      categoryIds: formData.getAll("categoryIds").map(Number).filter(Boolean),
      daysOff: formData.getAll("daysOff").map(Number).filter((n) => n >= 0 && n <= 6),
      bookable: formData.get("bookable") === "on",
      showOnSite: formData.get("showOnSite") === "on",
      active: formData.get("active") === "on",
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    };
    if (id) {
      const [current] = await db.select().from(schema.staff).where(eq(schema.staff.id, id));
      if (current?.role === "owner") values.active = true;
      await db.update(schema.staff).set(values).where(eq(schema.staff.id, id));
    } else {
      await db.insert(schema.staff).values({ ...values, role: "staff", sort: 50 });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar" };
  }
  revalidatePath("/", "layout");
  redirect("/admin/equipo");
}
