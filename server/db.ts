import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  products, orders, orderItems, ratings, userProfiles,
  InsertProduct, InsertOrder, InsertOrderItem, InsertUserProfile
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
    }
  }
  return _db;
}

// ── Products ──────────────────────────────────────────────────
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(desc(products.avgRating));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
}

export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.category, category));
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db.insert(products).values(data).returning())[0];
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(eq(products.id, id));
}

// ── Ratings ───────────────────────────────────────────────────
export async function upsertRating(productId: number, supabaseUserId: string, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(ratings).values({ productId, supabaseUserId, rating })
    .onConflictDoUpdate({
      target: [ratings.productId, ratings.supabaseUserId],
      set: { rating, updatedAt: new Date() },
    });
  const allRatings = await db.select().from(ratings).where(eq(ratings.productId, productId));
  const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  const rounded = Math.round(avg * 2) / 2;
  await db.update(products).set({ avgRating: rounded, ratingCount: allRatings.length, updatedAt: new Date() }).where(eq(products.id, productId));
  return { avg: rounded, count: allRatings.length };
}

export async function getUserRating(productId: number, supabaseUserId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(ratings).where(and(eq(ratings.productId, productId), eq(ratings.supabaseUserId, supabaseUserId))).limit(1))[0] ?? null;
}

export async function resetProductRating(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(ratings).where(eq(ratings.productId, productId));
  await db.update(products).set({ avgRating: 0, ratingCount: 0, updatedAt: new Date() }).where(eq(products.id, productId));
  return { success: true };
}

// ── Orders ────────────────────────────────────────────────────
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db.insert(orders).values(data).returning())[0];
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(orders).where(eq(orders.id, id)).limit(1))[0];
}

export async function getOrdersByUser(supabaseUserId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.supabaseUserId, supabaseUserId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function updateOrderStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(orders).set({ status: status as any, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(orderItems).values(items).returning();
}

// ── User Profiles ─────────────────────────────────────────────
export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return (await db.insert(userProfiles).values(data)
    .onConflictDoUpdate({
      target: userProfiles.supabaseId,
      set: { ...data, updatedAt: new Date() },
    }).returning())[0];
}

export async function getUserProfile(supabaseId: string) {
  const db = await getDb();
  if (!db) return null;
  return (await db.select().from(userProfiles).where(eq(userProfiles.supabaseId, supabaseId)).limit(1))[0] ?? null;
}

export async function getUserProfileByIdentifier(identifier: string) {
  const db = await getDb();
  if (!db) return null;
  const byEmail = await db.select().from(userProfiles).where(eq(userProfiles.email, identifier)).limit(1);
  if (byEmail[0]) return byEmail[0];
  const byUsername = await db.select().from(userProfiles).where(eq(userProfiles.username, identifier)).limit(1);
  return byUsername[0] ?? null;
}

export async function getAllUserProfiles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userProfiles).orderBy(userProfiles.privilege, userProfiles.createdAt);
}

export async function updateUserPrivilege(supabaseId: string, privilege: "user" | "admin" | "owner") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(userProfiles).set({ privilege, updatedAt: new Date() }).where(eq(userProfiles.supabaseId, supabaseId)).returning();
}

// ── Discounts ─────────────────────────────────────────────────
import { majorDiscount } from "../drizzle/schema";

export async function getActiveMajorDiscount() {
  const db = await getDb();
  if (!db) return null;
  const now = new Date();
  const results = await db.select().from(majorDiscount)
    .where(eq(majorDiscount.active, true))
    .orderBy(desc(majorDiscount.createdAt))
    .limit(1);
  const discount = results[0];
  if (!discount) return null;
  if (discount.endDate && discount.endDate < now) return null;
  return discount;
}

export async function setMajorDiscount(type: string, value: number, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Deactivate old ones
  await db.update(majorDiscount).set({ active: false });
  return (await db.insert(majorDiscount).values({ type, value, endDate, active: true }).returning())[0];
}

export async function removeMajorDiscount() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(majorDiscount).set({ active: false });
}

export async function setProductDiscount(id: number, type: string | null, value: number | null, endDate?: Date | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set({
    discountType: type,
    discountValue: value,
    discountEndDate: endDate ?? null,
    updatedAt: new Date(),
  }).where(eq(products.id, id)).returning();
}