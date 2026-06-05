CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"supabase_user_id" text NOT NULL,
	"product_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_supabase_user_id_product_id_unique" UNIQUE("supabase_user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"supabase_user_id" text NOT NULL,
	"rating" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_product_id_supabase_user_id_unique" UNIQUE("product_id","supabase_user_id")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "customizations" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "supabase_user_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "avg_rating" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "rating_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;