CREATE TABLE "major_discount" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(10) NOT NULL,
	"value" real NOT NULL,
	"end_date" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_type" varchar(10);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_value" real;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "avatar_url" text;