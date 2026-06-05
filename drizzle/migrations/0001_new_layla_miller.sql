DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "supabase_user_id";--> statement-breakpoint
DROP TYPE "public"."role";