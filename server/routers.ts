import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  createOrder,
  getOrderById,
  getOrderItems,
  createOrderItems,
  getOrdersByUser,
  updateOrderStatus,
  getAllOrders,
  upsertRating,
  getUserRating,
  resetProductRating,
  getAllUserProfiles,
  updateUserPrivilege,
  getUserProfileByIdentifier,
  getActiveMajorDiscount,
  setMajorDiscount,
  removeMajorDiscount,
  setProductDiscount,
} from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OWNER, isAdmin, isOwner, getPrivilege } from "../shared/privileges";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),

  products: router({
    list: publicProcedure.query(() => getAllProducts()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getProductById(input.id)),
    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(({ input }) => getProductsByCategory(input.category)),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.number().positive(),
          category: z.string().min(1),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          customizations: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return createProduct({
          ...input,
          price: Math.round(input.price * 100),
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.number().positive().optional(),
          category: z.string().min(1).optional(),
          imageUrl: z.string().optional(),
          imageKey: z.string().optional(),
          customizations: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        const { id, price, ...rest } = input;
        const data: any = { ...rest };
        if (price !== undefined) data.price = Math.round(price * 100);
        return updateProduct(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return deleteProduct(input.id);
      }),
    resetRating: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return resetProductRating(input.id);
      }),
  }),

  ratings: router({
    rate: protectedProcedure
      .input(
        z.object({ productId: z.number(), rating: z.number().min(0.5).max(5) })
      )
      .mutation(async ({ ctx, input }) =>
        upsertRating(input.productId, ctx.user!.id, input.rating)
      ),
    getUserRating: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ ctx, input }) =>
        getUserRating(input.productId, ctx.user!.id)
      ),
  }),

  orders: router({
    create: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(1),
          customerAddress: z.string().min(1),
          items: z.array(
            z.object({
              productId: z.number(),
              productName: z.string(),
              quantity: z.number().positive(),
              price: z.number().positive(),
              customizations: z.string().optional(),
            })
          ),
          totalPrice: z.number().positive(),
          supabaseUserId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const orderResult = await createOrder({
          supabaseUserId: input.supabaseUserId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          totalPrice: Math.round(input.totalPrice * 100),
          status: "pending",
        });
        const orderId = orderResult.id;
        await createOrderItems(
          input.items.map(item => ({
            orderId,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: Math.round(item.price * 100),
            customizations: item.customizations,
          }))
        );
        return { orderId, success: true };
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) return null;
        const items = await getOrderItems(input.id);
        return { ...order, items };
      }),
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const userOrders = await getOrdersByUser(ctx.user!.id);
      return Promise.all(
        userOrders.map(async o => ({ ...o, items: await getOrderItems(o.id) }))
      );
    }),
    all: protectedProcedure.query(async ({ ctx }) => {
      if (!isAdmin(ctx.user?.email)) throw new TRPCError({ code: "FORBIDDEN" });
      return getAllOrders();
    }),
    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum([
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
          ]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return updateOrderStatus(input.id, input.status);
      }),
  }),

  discounts: router({
    getMajor: publicProcedure.query(() => getActiveMajorDiscount()),
    setMajor: protectedProcedure
      .input(
        z.object({
          type: z.enum(["percent", "cash"]),
          value: z.number().positive(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return setMajorDiscount(
          input.type,
          input.value,
          input.endDate ? new Date(input.endDate) : undefined
        );
      }),
    removeMajor: protectedProcedure.mutation(async ({ ctx }) => {
      if (!isAdmin(ctx.user?.email)) throw new TRPCError({ code: "FORBIDDEN" });
      return removeMajorDiscount();
    }),
    setProductDiscount: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          type: z.enum(["percent", "cash"]).nullable(),
          value: z.number().nullable(),
          endDate: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isAdmin(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        return setProductDiscount(
          input.id,
          input.type,
          input.value,
          input.endDate ? new Date(input.endDate) : null
        );
      }),
  }),

  owner: router({
    allUsers: protectedProcedure.query(async ({ ctx }) => {
      if (!isOwner(ctx.user?.email)) throw new TRPCError({ code: "FORBIDDEN" });
      const users = await getAllUserProfiles();
      const hasOwner = users.some(u => u.email === ctx.user!.email);
      const result = hasOwner
        ? users
        : [
            {
              id: 0,
              supabaseId: ctx.user!.id,
              email: ctx.user!.email,
              username: null,
              fullName: null,
              phone: null,
              address: null,
              birthday: null,
              privilege: "owner" as const,
              phoneVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            ...users,
          ];
      return Promise.all(
        result.map(async u => ({
          ...u,
          // Always derive privilege from shared/privileges.ts, not DB
          privilege: getPrivilege(u.email),
          orders: await getOrdersByUser(u.supabaseId),
        }))
      );
    }),
    updatePrivilege: protectedProcedure
      .input(
        z.object({
          supabaseId: z.string(),
          privilege: z.enum(["user", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!isOwner(ctx.user?.email))
          throw new TRPCError({ code: "FORBIDDEN" });
        // Prevent demoting owner or anyone in ADMINS/OWNER list from being changed here
        // Privilege is managed via shared/privileges.ts, DB is just for display
        return updateUserPrivilege(input.supabaseId, input.privilege);
      }),
  }),
});

export type AppRouter = typeof appRouter;
