ALTER TABLE "media" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "staff_id" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_category_id_service_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;