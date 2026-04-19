import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  banUser,
  browseUsers,
  buildRoomId,
  completeChatUnlock,
  createChatUnlock,
  getAllPayments,
  getAllUsers,
  getChatUnlock,
  getDistinctLocations,
  getMessages,
  getPendingUnlockById,
  getUserById,
  sendMessage,
  updateUserProfile,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ──────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const id = input.userId ?? ctx.user.id;
        const user = await getUserById(id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.isBanned && id !== ctx.user.id)
          throw new TRPCError({ code: "NOT_FOUND" });
        return user;
      }),

    update: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2).max(64).optional(),
          age: z.number().int().min(18).max(100).optional(),
          gender: z.enum(["male", "female"]).optional(),
          location: z.string().max(128).optional(),
          church: z.string().max(256).optional(),
          bio: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });

        const merged = { ...input };
        // Mark profile complete if all required fields present
        const name = merged.name ?? user.name;
        const age = merged.age ?? user.age;
        const gender = merged.gender ?? user.gender;
        const location = merged.location ?? user.location;
        const church = merged.church ?? user.church;
        const profileComplete = !!(name && age && gender && location && church);

        await updateUserProfile(ctx.user.id, { ...merged, profileComplete });
        return { success: true };
      }),

    uploadPhoto: protectedProcedure
      .input(
        z.object({
          base64: z.string(), // data:image/...;base64,...
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 2 * 1024 * 1024)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Image too large (max 2MB)" });

        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const key = `profiles/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await updateUserProfile(ctx.user.id, { photoUrl: url, photoKey: key });
        return { url };
      }),
  }),

  // ─── Browse ───────────────────────────────────────────────────────────────
  browse: router({
    list: protectedProcedure
      .input(
        z.object({
          gender: z.enum(["male", "female"]).optional(),
          location: z.string().optional(),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended." });
        const list = await browseUsers(
          ctx.user.id,
          { gender: input.gender, location: input.location },
          20,
          input.offset
        );
        return list;
      }),

    locations: protectedProcedure.query(async () => {
      return getDistinctLocations();
    }),
  }),

  // ─── Chat ─────────────────────────────────────────────────────────────────
  chat: router({
    checkUnlock: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        return { unlocked: !!unlock };
      }),

    messages: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        // Server-side enforcement
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        if (!unlock)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Chat not unlocked. Please pay to access this conversation.",
          });
        const roomId = buildRoomId(ctx.user.id, input.targetId);
        const msgs = await getMessages(roomId, 50);
        return msgs.reverse(); // oldest first
      }),

    send: protectedProcedure
      .input(z.object({ targetId: z.number().int(), content: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        // Server-side enforcement
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        if (!unlock)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Chat not unlocked.",
          });
        const roomId = buildRoomId(ctx.user.id, input.targetId);
        const msg = await sendMessage({
          roomId,
          senderId: ctx.user.id,
          content: input.content,
        });
        return msg;
      }),
  }),

  // ─── Payments ─────────────────────────────────────────────────────────────
  payment: router({
    initiate: protectedProcedure
      .input(
        z.object({
          targetId: z.number().int(),
          provider: z.enum(["mtn", "airtel", "mock"]),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN" });

        // Prevent duplicate payment
        const existing = await getChatUnlock(ctx.user.id, input.targetId);
        if (existing)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Chat already unlocked." });

        const target = await getUserById(input.targetId);
        if (!target || target.isBanned)
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });

        const id = await createChatUnlock({
          payerId: ctx.user.id,
          targetId: input.targetId,
          amount: 10,
          provider: input.provider,
          status: "pending",
        });

        return { paymentId: id, amount: 10, provider: input.provider };
      }),

    confirm: protectedProcedure
      .input(
        z.object({
          paymentId: z.number().int(),
          // In production this would be a real transaction reference
          mockReference: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify the payment belongs to the current user (server-side ownership check)
        const unlock = await getPendingUnlockById(input.paymentId, ctx.user.id);
        if (!unlock) throw new TRPCError({ code: "FORBIDDEN", message: "Payment not found or not yours." });
        if (unlock.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Already completed." });
        // Mock: always succeed for now
        const reference = input.mockReference ?? `MOCK-${nanoid(12).toUpperCase()}`;
        await completeChatUnlock(input.paymentId, reference);
        return { success: true, reference };
      }),
  }),

  // ─── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    users: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    banUser: adminProcedure
      .input(z.object({ userId: z.number().int(), ban: z.boolean() }))
      .mutation(async ({ input }) => {
        await banUser(input.userId, input.ban);
        return { success: true };
      }),

    payments: adminProcedure.query(async () => {
      return getAllPayments();
    }),
  }),
});

export type AppRouter = typeof appRouter;
