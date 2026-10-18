import Link from "next/link";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { Chevron, Empty, PageHeader, Pill, buttonClass, cx, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/money";
import { prettyPhone } from "@/lib/phone";
import { addDays, localDate, shortDate } from "@/lib/time";

export const metadata = { title: "Clientas" };

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "cumple", label: "Cumpleaños del mes" },
  { id: "volver", label: "Hace tiempo no vienen" },
  { id: "frecuentes", label: "Más fieles" },
];

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string; f?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const f = sp.f ?? "todas";
  const today = localDate();
  const month = today.slice(5, 7);

  const visits = sql<number>`count(distinct ${schema.tickets.id}) filter (where ${schema.tickets.status} = 'pagado')`;
  const spent = sql<number>`coalesce(sum(${schema.tickets.total}) filter (where ${schema.tickets.status} = 'pagado'),0)`;
  const last = sql<string | null>`max(${schema.tickets.paidAt})`;

  let query = db
    .select({
      c: schema.clients,
      visits: sql<number>`${visits}::int`,
      spent: sql<number>`${spent}::int`,
      last,
    })
    .from(schema.clients)
    .leftJoin(schema.tickets, eq(schema.tickets.clientId, schema.clients.id))
    .where(
      q
        ? or(ilike(schema.clients.name, `%${q}%`), ilike(schema.clients.phone, `%${q.replace(/\D/g, "").replace(/^0/, "") || q}%`))
        : f === "cumple"
          ? sql`to_char(${schema.clients.birthday}, 'MM') = ${month}`
          : undefined,
    )
    .groupBy(schema.clients.id)
    .$dynamic();

  if (f === "volver") {
    query = query.having(sql`${last} < ${addDays(today, -45)}::date`).orderBy(desc(last));
  } else if (f === "frecuentes") {
    query = query.orderBy(desc(visits));
  } else if (f === "cumple") {
    query = query.orderBy(sql`to_char(${schema.clients.birthday}, 'DD')`);
  } else {
    query = query.orderBy(desc(sql`coalesce(${last}, ${schema.clients.createdAt})`));
  }
  const rows = await query.limit(300);

  return (
    <>
      <PageHeader title="Clientas" back="/admin/mas" action={<Link href="/admin/clientes/nueva" className={buttonClass("primary", "md")}>Nueva</Link>} />
      <form className="px-4 lg:px-0">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por nombre o teléfono" className={inputClass} />
      </form>
      {!q && (
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-3 lg:px-0">
          {FILTERS.map((x) => (
            <Link
              key={x.id}
              href={`/admin/clientes?f=${x.id}`}
              className={cx("press h-9 shrink-0 rounded-full px-3.5 text-[14px] leading-9 font-medium", f === x.id ? "bg-gold text-on-gold" : "bg-surface")}
            >
              {x.label}
            </Link>
          ))}
        </div>
      )}
      {f === "volver" && !q && (
        <p className="mx-4 mb-3 rounded-xl bg-gold-soft p-3 text-[14px] text-gold lg:mx-0">
          Escríbeles para invitarlas a volver: entra a cada una y toca “Te extrañamos”.
        </p>
      )}
      <section className="px-4 lg:px-0">
        {rows.length === 0 ? (
          <Empty title={q ? "No encontramos a nadie" : "Todavía no hay clientas aquí"}>
            Se agregan solas al cobrar o agendar con nombre.
          </Empty>
        ) : (
          <ul className="divide-y divide-surface-2 overflow-hidden rounded-2xl bg-surface">
            {rows.map(({ c, visits: v, spent: s, last: l }) => (
              <li key={c.id}>
                <Link href={`/admin/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover-lift">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-medium">
                      {c.name} {c.noShows > 1 && <Pill tone="bad">{c.noShows} faltas</Pill>}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {prettyPhone(c.phone) || "Sin teléfono"}
                      {v ? ` · ${v} visita${v === 1 ? "" : "s"} · ${money(s)}` : ""}
                      {l ? ` · última ${shortDate(localDate(new Date(l)))}` : ""}
                      {f === "cumple" && c.birthday ? ` · 🎂 ${shortDate(c.birthday)}` : ""}
                    </p>
                  </div>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
