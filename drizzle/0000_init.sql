CREATE TABLE "advances" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'efectivo' NOT NULL,
	"note" text,
	"payout_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client_name" text NOT NULL,
	"client_phone" text,
	"staff_id" integer,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"notes" text,
	"created_by_id" integer,
	"ticket_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_closures" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"expected_cash" integer NOT NULL,
	"counted_cash" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cash_closures_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"birthday" date,
	"notes" text,
	"no_shows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'efectivo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'gallery' NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"width" integer,
	"height" integer,
	"alt" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone NOT NULL,
	"services_count" integer DEFAULT 0 NOT NULL,
	"gross_sales" integer DEFAULT 0 NOT NULL,
	"commission" integer DEFAULT 0 NOT NULL,
	"tips" integer DEFAULT 0 NOT NULL,
	"advances" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"method" text DEFAULT 'efectivo' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"price_text" text,
	"valid_until" date,
	"media_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"keys" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "service_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer NOT NULL,
	"price_from" boolean DEFAULT false NOT NULL,
	"duration_min" integer DEFAULT 60 NOT NULL,
	"commission_pct" integer,
	"bookable" boolean DEFAULT true NOT NULL,
	"show_on_site" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text,
	"password_hash" text,
	"role" text DEFAULT 'staff' NOT NULL,
	"phone" text,
	"commission_pct" integer DEFAULT 50 NOT NULL,
	"color" text DEFAULT '#C9A45C' NOT NULL,
	"specialty" text,
	"bio" text,
	"category_ids" integer[] DEFAULT '{}' NOT NULL,
	"days_off" integer[] DEFAULT '{}' NOT NULL,
	"bookable" boolean DEFAULT true NOT NULL,
	"show_on_site" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "ticket_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"service_id" integer,
	"description" text NOT NULL,
	"staff_id" integer,
	"price" integer NOT NULL,
	"net_price" integer NOT NULL,
	"commission_pct" integer NOT NULL,
	"staff_amount" integer NOT NULL,
	"salon_amount" integer NOT NULL,
	"payout_id" integer
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"client_name" text,
	"appointment_id" integer,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"payment_method" text,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"tip" integer DEFAULT 0 NOT NULL,
	"tip_staff_id" integer,
	"tip_payout_id" integer,
	"notes" text,
	"void_reason" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "advances" ADD CONSTRAINT "advances_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advances" ADD CONSTRAINT "advances_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tip_staff_id_staff_id_fk" FOREIGN KEY ("tip_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tip_payout_id_payouts_id_fk" FOREIGN KEY ("tip_payout_id") REFERENCES "public"."payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_starts_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_phone_idx" ON "clients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "ticket_items_staff_idx" ON "ticket_items" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "tickets_paid_idx" ON "tickets" USING btree ("paid_at");