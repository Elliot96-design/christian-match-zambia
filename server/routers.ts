import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addUserPhoto,
  banUser,
  browseUsers,
  buildRoomId,
  completeChatUnlock,
  countUserPhotos,
  createChatUnlock,
  createPremiumPayment,
  getAllPayments,
  getAllUsers,
  getChatUnlock,
  getDistinctLocations,
  getMessages,
  getMyUnlockedChats,
  getPendingUnlockById,
  getUserById,
  getUserPhotos,
  hasAnyCompletedUnlock,
  sendMessage,
  setUserPremium,
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
          base64: z.string(),
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

    // Get all photos for the current user
    myPhotos: protectedProcedure.query(async ({ ctx }) => {
      return getUserPhotos(ctx.user.id);
    }),

    // Add an extra photo (max 5)
    addPhoto: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const count = await countUserPhotos(ctx.user.id);
        if (count >= 5)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Maximum 5 photos allowed." });

        const base64Data = input.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 2 * 1024 * 1024)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Image too large (max 2MB)" });

        const ext = input.mimeType.split("/")[1] ?? "jpg";
        const key = `gallery/${ctx.user.id}-${nanoid(8)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const photo = await addUserPhoto({
          userId: ctx.user.id,
          photoUrl: url,
          photoKey: key,
          isMain: count === 0,
        });
        return photo;
      }),

    // Check if current user qualifies for premium upgrade nudge
    premiumStatus: protectedProcedure.query(async ({ ctx }) => {
      const hasPaid = await hasAnyCompletedUnlock(ctx.user.id);
      return {
        isPremium: ctx.user.isPremium,
        hasPaidUnlock: hasPaid,
        // Show upgrade nudge if they've paid at least one K10 unlock but aren't premium yet
        showUpgradeNudge: hasPaid && !ctx.user.isPremium,
      };
    }),

    // Upgrade current user to premium (admin-granted or after real payment integration)
    upgradeToPremium: protectedProcedure
      .input(z.object({ confirm: z.literal(true) }))
      .mutation(async ({ ctx }) => {
        if (ctx.user.isPremium)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Already a premium member." });
        await setUserPremium(ctx.user.id, true);
        return { success: true };
      }),

    // Get current user's plan details
    getPlanDetails: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      // Renewal date = premiumSince + 30 days (monthly rolling)
      let renewalDate: Date | null = null;
      if (user.isPremium && user.premiumSince) {
        renewalDate = new Date(user.premiumSince);
        renewalDate.setDate(renewalDate.getDate() + 30);
      }
      return {
        isPremium: user.isPremium,
        planType: user.isPremium ? "Premium Monthly" : null,
        premiumSince: user.premiumSince ?? null,
        renewalDate,
        amount: 50, // K50/month
        benefits: [
          "Unlimited chat unlocks",
          "Premium badge on your profile",
          "Priority placement in browse",
          "See who liked your profile",
          "Advanced filters (age range, faith level)",
        ],
      };
    }),

    // Cancel premium subscription
    cancelPremium: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.isPremium)
        throw new TRPCError({ code: "BAD_REQUEST", message: "You are not a premium member." });
      await setUserPremium(ctx.user.id, false);
      return { success: true };
    }),

    // Calculate profile completion score
    completionScore: protectedProcedure.query(async ({ ctx }) => {
      const u = ctx.user;
      const fields = [
        !!u.name,
        !!u.age,
        !!u.gender,
        !!u.location,
        !!u.church,
        !!u.bio,
        !!u.photoUrl,
      ];
      const score = Math.round((fields.filter(Boolean).length / fields.length) * 100);
      return { score };
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
    // List all users the current user has unlocked chat with
    myUnlocked: protectedProcedure.query(async ({ ctx }) => {
      return getMyUnlockedChats(ctx.user.id);
    }),

    checkUnlock: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        return { unlocked: !!unlock };
      }),

    messages: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .query(async ({ ctx, input }) => {
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        if (!unlock)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Chat not unlocked. Please pay to access this conversation.",
          });
        const roomId = buildRoomId(ctx.user.id, input.targetId);
        const msgs = await getMessages(roomId, 50);
        return msgs.reverse();
      }),

    send: protectedProcedure
      .input(z.object({ targetId: z.number().int(), content: z.string().min(1).max(1000) }))
      .mutation(async ({ ctx, input }) => {
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        if (!unlock)
          throw new TRPCError({ code: "FORBIDDEN", message: "Chat not unlocked." });
        const roomId = buildRoomId(ctx.user.id, input.targetId);
        const msg = await sendMessage({ roomId, senderId: ctx.user.id, content: input.content });
        return msg;
      }),
  }),

  // ─── Payments ─────────────────────────────────────────────────────────────
  payment: router({
    // Initiate a premium subscription payment (K50)
    initiatePremium: protectedProcedure
      .input(z.object({ provider: z.enum(["mtn", "airtel", "mock"]), phone: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned) throw new TRPCError({ code: "FORBIDDEN" });
        if (ctx.user.isPremium) throw new TRPCError({ code: "BAD_REQUEST", message: "Already a premium member." });
        const id = await createPremiumPayment({ payerId: ctx.user.id, amount: 50, provider: input.provider });
        return { paymentId: id, amount: 50, provider: input.provider };
      }),

    // Confirm a premium subscription payment and activate premium
    confirmPremium: protectedProcedure
      .input(z.object({ paymentId: z.number().int(), mockReference: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const unlock = await getPendingUnlockById(input.paymentId, ctx.user.id);
        if (!unlock) throw new TRPCError({ code: "FORBIDDEN", message: "Payment not found or not yours." });
        if (unlock.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Already completed." });
        const reference = input.mockReference ?? `PREM-${nanoid(12).toUpperCase()}`;
        await completeChatUnlock(input.paymentId, reference);
        await setUserPremium(ctx.user.id, true);
        return { success: true, reference };
      }),

    // Initiate a single-chat unlock payment (K10)
    initiate: protectedProcedure
      .input(
        z.object({
          targetId: z.number().int(),
          provider: z.enum(["mtn", "airtel", "mock"]),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned) throw new TRPCError({ code: "FORBIDDEN" });
        const existing = await getChatUnlock(ctx.user.id, input.targetId);
        if (existing) throw new TRPCError({ code: "BAD_REQUEST", message: "Chat already unlocked." });
        const target = await getUserById(input.targetId);
        if (!target || target.isBanned) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
        const id = await createChatUnlock({
          payerId: ctx.user.id,
          targetId: input.targetId,
          amount: 10,
          provider: input.provider,
          status: "pending",
        });
        return { paymentId: id, amount: 10, provider: input.provider };
      }),

    // Confirm a single-chat unlock payment
    confirm: protectedProcedure
      .input(z.object({ paymentId: z.number().int(), mockReference: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const unlock = await getPendingUnlockById(input.paymentId, ctx.user.id);
        if (!unlock) throw new TRPCError({ code: "FORBIDDEN", message: "Payment not found or not yours." });
        if (unlock.status === "completed") throw new TRPCError({ code: "BAD_REQUEST", message: "Already completed." });
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
