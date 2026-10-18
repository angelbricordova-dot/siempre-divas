import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import { METHOD_LABEL } from "@/lib/labels";
import { endOfDay, localDate, localTime, startOfDay } from "@/lib/time";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const num = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const from = req.nextUrl.searchParams.get("from") ?? localDate();
  const to = req.nextUrl.searchParams.get("to") ?? from;
  const rows = await db
    .select({ item: schema.ticketItems, ticket: schema.tickets, staffName: schema.staff.name })
    .from(schema.ticketItems)
    .innerJoin(schema.tickets, eq(schema.tickets.id, schema.ticketItems.ticketId))
    .leftJoin(schema.staff, eq(schema.staff.id, schema.ticketItems.staffId))
    .where(and(eq(schema.tickets.status, "pagado"), gte(schema.tickets.paidAt, startOfDay(from)), lt(schema.tickets.paidAt, endOfDay(to))))
    .orderBy(asc(schema.tickets.paidAt));
  const header = ["Fecha", "Hora", "Ticket", "Clienta", "Servicio", "Atendió", "Precio", "Cobrado (con descuento)", "% trabajadora", "Para trabajadora", "Para el salón", "Forma de pago"];
  const lines = rows.map(({ item, ticket, staffName }) =>
    [
      localDate(ticket.paidAt!),
      localTime(ticket.paidAt!),
      ticket.id,
      ticket.clientName ?? "",
      item.description,
      staffName ?? "Salón",
      num(item.price),
      num(item.netPrice),
      item.commissionPct,
      num(item.staffAmount),
      num(item.salonAmount),
      METHOD_LABEL[ticket.paymentMethod ?? ""] ?? "",
    ]
      .map(cell)
      .join(";"),
  );
  // BOM + punto y coma: Excel en español lo abre bien.
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="siempre-divas-ventas-${from}-a-${to}.csv"`,
    },
  });
}
