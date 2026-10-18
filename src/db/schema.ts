import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Montos en centavos (USD) para evitar errores de redondeo.

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  // Nombre (de pila) y apellido por separado; el nombre completo se arma con fullName().
  name: text("name").notNull(),
  lastName: text("last_name"),
  // Cargo dentro del salón: Estilista, Manicurista, Recepcionista…
  position: text("position"),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  role: text("role", { enum: ["owner", "staff"] }).notNull().default("staff"),
  phone: text("phone"),
  // Porcentaje que se lleva la trabajadora por cada servicio (el resto es del salón).
  commissionPct: integer("commission_pct").notNull().default(50),
  color: text("color").notNull().default("#C9A45C"),
  specialty: text("specialty"),
  bio: text("bio"),
  categoryIds: integer("category_ids").array().notNull().default([]),
  // Días que no trabaja: 0 = domingo … 6 = sábado.
  daysOff: integer("days_off").array().notNull().default([]),
  bookable: boolean("bookable").notNull().default(true),
  showOnSite: boolean("show_on_site").notNull().default(true),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const serviceCategories = pgTable("service_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sort: integer("sort").notNull().default(0),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => serviceCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  priceFrom: boolean("price_from").notNull().default(false),
  durationMin: integer("duration_min").notNull().default(60),
  // Si se define, reemplaza el porcentaje de la trabajadora para este servicio.
  commissionPct: integer("commission_pct"),
  bookable: boolean("bookable").notNull().default(true),
  showOnSite: boolean("show_on_site").notNull().default(true),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone"),
    birthday: date("birthday"),
    notes: text("notes"),
    noShows: integer("no_shows").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clients_phone_idx").on(t.phone)],
);

export type AppointmentItem = {
  serviceId: number;
  name: string;
  price: number;
  durationMin: number;
};

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name").notNull(),
    clientPhone: text("client_phone"),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    items: jsonb("items").$type<AppointmentItem[]>().notNull().default([]),
    status: text("status", {
      enum: ["pendiente", "confirmada", "completada", "cancelada", "no_asistio"],
    })
      .notNull()
      .default("pendiente"),
    source: text("source", { enum: ["web", "staff", "admin"] }).notNull().default("admin"),
    notes: text("notes"),
    createdById: integer("created_by_id").references(() => staff.id, { onDelete: "set null" }),
    ticketId: integer("ticket_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("appointments_starts_idx").on(t.startsAt)],
);

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  servicesCount: integer("services_count").notNull().default(0),
  grossSales: integer("gross_sales").notNull().default(0),
  commission: integer("commission").notNull().default(0),
  tips: integer("tips").notNull().default(0),
  advances: integer("advances").notNull().default(0),
  total: integer("total").notNull().default(0),
  method: text("method").notNull().default("efectivo"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const PAYMENT_METHODS = ["efectivo", "transferencia", "tarjeta", "deuna"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").references(() => clients.id, { onDelete: "set null" }),
    clientName: text("client_name"),
    appointmentId: integer("appointment_id"),
    status: text("status", { enum: ["pendiente", "pagado", "anulado"] })
      .notNull()
      .default("pendiente"),
    paymentMethod: text("payment_method", { enum: PAYMENT_METHODS }),
    subtotal: integer("subtotal").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull().default(0),
    tip: integer("tip").notNull().default(0),
    tipStaffId: integer("tip_staff_id").references(() => staff.id, { onDelete: "set null" }),
    tipPayoutId: integer("tip_payout_id").references(() => payouts.id, { onDelete: "set null" }),
    notes: text("notes"),
    voidReason: text("void_reason"),
    createdById: integer("created_by_id").references(() => staff.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [index("tickets_paid_idx").on(t.paidAt)],
);

export const ticketItems = pgTable(
  "ticket_items",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    serviceId: integer("service_id").references(() => services.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    staffId: integer("staff_id").references(() => staff.id, { onDelete: "set null" }),
    price: integer("price").notNull(),
    // Monto final del ítem después de repartir el descuento del ticket.
    netPrice: integer("net_price").notNull(),
    commissionPct: integer("commission_pct").notNull(),
    staffAmount: integer("staff_amount").notNull(),
    salonAmount: integer("salon_amount").notNull(),
    payoutId: integer("payout_id").references(() => payouts.id, { onDelete: "set null" }),
  },
  (t) => [index("ticket_items_staff_idx").on(t.staffId)],
);

export const advances = pgTable("advances", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  method: text("method").notNull().default("efectivo"),
  note: text("note"),
  payoutId: integer("payout_id").references(() => payouts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  method: text("method").notNull().default("efectivo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cashClosures = pgTable("cash_closures", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  expectedCash: integer("expected_cash").notNull(),
  countedCash: integer("counted_cash").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priceText: text("price_text"),
  validUntil: date("valid_until"),
  mediaId: integer("media_id"),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  kind: text("kind", { enum: ["gallery", "promo", "staff"] }).notNull().default("gallery"),
  mime: text("mime").notNull(),
  data: bytea("data").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DayHours = { open: string; close: string } | null;

export type Settings = {
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  mapsUrl: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  // Índice 0 = domingo.
  hours: DayHours[];
  slotMinutes: number;
  minNoticeMinutes: number;
  maxDaysAhead: number;
  bookingEnabled: boolean;
  bookingPolicy: string;
  ownerWhatsapp: string;
  callmebotApiKey: string;
  // Día en que empieza la semana de cuentas (0 = domingo).
  weekStartsOn: number;
  payday: number;
  aboutText: string;
};

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<Settings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").$type<{ p256dh: string; auth: string }>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Staff = typeof staff.$inferSelect;
export type Service = typeof services.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketItem = typeof ticketItems.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
export type Advance = typeof advances.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Promotion = typeof promotions.$inferSelect;
