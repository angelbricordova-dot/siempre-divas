ALTER TABLE "staff" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "position" text;
--> statement-breakpoint
UPDATE "staff" SET "position" = 'Dueña' WHERE "role" = 'owner' AND "position" IS NULL;
