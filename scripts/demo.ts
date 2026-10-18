/* Datos de DEMOSTRACIÓN para probar en local. No usar en producción. */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { distributeDiscount, splitCommission } from "../src/lib/money";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Solo para desarrollo");
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });
  const svcs = await db.select().from(schema.services);
  const cats = await db.select().from(schema.serviceCategories);
  const cat = (n: string) => cats.find((c) => c.name === n)!.id;
  const pass = await bcrypt.hash("demo1234", 10);
  const staff = await db
    .insert(schema.staff)
    .values([
      { name: "Andrea Demo", username: "andrea", passwordHash: pass, commissionPct: 40, color: "#C2185B", specialty: "Uñas acrílicas y nail art", categoryIds: [cat("Uñas")], sort: 1 },
      { name: "Valeria Demo", username: "valeria", passwordHash: pass, commissionPct: 45, color: "#1565C0", specialty: "Color y keratina", categoryIds: [cat("Cabello"), cat("Maquillaje")], daysOff: [1], sort: 2 },
      { name: "Karla Demo", username: "karla", passwordHash: pass, commissionPct: 50, color: "#00897B", specialty: "Cejas, pestañas y depilación", categoryIds: [cat("Cejas y pestañas"), cat("Depilación"), cat("Uñas")], sort: 3 },
    ])
    .returning();
  const clients = await db
    .insert(schema.clients)
    .values([
      { name: "María José Ejemplo", phone: "593990000001" },
      { name: "Daniela Ejemplo", phone: "593990000002", birthday: "1995-10-25" },
      { name: "Gabriela Ejemplo", phone: "593990000003" },
    ])
    .returning();
  const methods = ["efectivo", "transferencia", "deuna", "efectivo"] as const;
  const now = Date.now();
  for (let d = 9; d >= 0; d--) {
    const n = 3 + ((d * 7) % 5);
    for (let k = 0; k < n; k++) {
      const w = staff[(d + k) % staff.length];
      const options = svcs.filter((s) => w.categoryIds.includes(s.categoryId));
      const s = options[(d * 3 + k) % options.length];
      const paidAt = new Date(now - d * 86400000 - (8 - k) * 3600000);
      const [t] = await db
        .insert(schema.tickets)
        .values({ clientId: clients[k % 3].id, clientName: clients[k % 3].name, status: "pagado", paymentMethod: methods[k % 4], subtotal: s.price, total: s.price, paidAt, createdAt: paidAt, tip: k === 1 ? 200 : 0, tipStaffId: k === 1 ? w.id : null })
        .returning();
      const [net] = distributeDiscount([s.price], 0);
      await db.insert(schema.ticketItems).values({ ticketId: t.id, serviceId: s.id, description: s.name, staffId: w.id, price: s.price, netPrice: net, commissionPct: w.commissionPct, ...splitCommission(net, w.commissionPct) });
    }
  }
  // Un ticket enviado a caja por una trabajadora.
  const s0 = svcs.find((s) => s.name.startsWith("Uñas acrílicas"))!;
  const [p] = await db.insert(schema.tickets).values({ status: "pendiente", subtotal: 3000, total: 3000, clientName: "Gabriela Ejemplo", createdById: staff[0].id }).returning();
  await db.insert(schema.ticketItems).values({ ticketId: p.id, serviceId: s0.id, description: s0.name, staffId: staff[0].id, price: 3000, netPrice: 3000, commissionPct: 40, staffAmount: 1200, salonAmount: 1800 });
  await db.insert(schema.advances).values({ staffId: staff[1].id, amount: 1000, note: "Pasaje" });
  await db.insert(schema.expenses).values([
    { date: new Date().toISOString().slice(0, 10), category: "Productos e insumos", description: "Esmaltes y acetona", amount: 2350 },
  ]);
  console.log("Datos de demostración creados. Usuarias: andrea / valeria / karla, clave demo1234");
  await client.end();
}
main();
