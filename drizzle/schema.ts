import { pgTable, serial, text, integer, timestamp, pgEnum, varchar, real, unique, boolean, date } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["pending", "confirmed", "shipped", "delivered", "cancelled"]);
export const privilegeEnum = pgEnum("privilege", ["user", "admin", "owner"]);

// User profiles (extends Supabase auth)
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  supabaseId: text("supabase_id").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  username: varchar("username", { length: 100 }),
  fullName: varchar("full_name", { length: 255 }),
  address: text("address"),
  birthday: date("birthday"),
  privilege: privilegeEnum("privilege").default("user").notNull(),
  phoneVerified: boolean("phone_verified").default(false),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: text("image_url"),
  imageKey: varchar("image_key", { length: 255 }),
  customizations: text("customizations"),
  avgRating: real("avg_rating").default(0),
  ratingCount: integer("rating_count").default(0),
  discountType: varchar("discount_type", { length: 10 }), // "percent" | "cash" | null
  discountValue: real("discount_value"),
  discountEndDate: timestamp("discount_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supabaseUserId: text("supabase_user_id"),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 320 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerAddress: text("customer_address").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  customizations: text("customizations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  supabaseUserId: text("supabase_user_id").notNull(),
  rating: real("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  uniqueUserProduct: unique().on(t.productId, t.supabaseUserId),
}));

export type Rating = typeof ratings.$inferSelect;

// Major discount (applies to all products)
export const majorDiscount = pgTable("major_discount", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 10 }).notNull(), // "percent" | "cash"
  value: real("value").notNull(),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MajorDiscount = typeof majorDiscount.$inferSelect;