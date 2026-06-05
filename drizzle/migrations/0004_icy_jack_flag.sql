CREATE TYPE "public"."privilege" AS ENUM('user', 'admin', 'owner');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"supabase_id" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"username" varchar(100),
	"full_name" varchar(255),
	"phone" varchar(30),
	"address" text,
	"birthday" date,
	"privilege" "privilege" DEFAULT 'user' NOT NULL,
	"phone_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_supabase_id_unique" UNIQUE("supabase_id")
);
--> statement-breakpoint
DROP TABLE "favorites" CASCADE;