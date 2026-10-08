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
  browseSwipeList,
  setUserOnline,
  buildRoomId,
  completeChatUnlock,
  countUserPhotos,
  createChatUnlock,
  createPremiumPayment,
  getAllPayments,
  getAllUsers,
  getChatUnlock,
  getChatroomMessages,
  getChatroomOnlineCount,
  getDistinctLocations,
  getMessageReactions,
  getMessages,
  getMyUnlockedChats,
  getPendingUnlockById,
  getUserById,
  getUserPhotos,
  hasAnyCompletedUnlock,
  postChatroomMessage,
  sendMessage,
  setUserPremium,
  toggleChatroomReaction,
  getFaithProfile,
  updateFaithProfile,
  updateRelationshipPrefs,
  updateUserProfile,
  getLoveStories,
  createLoveStory,
  getAnnouncements,
  createAnnouncement,
  getSuggestedProfiles,
  getNotificationsForUser,
  getAdminByUsername,
  getAdminStats,
  getAllSupportTickets,
  createSupportTicket,
  resolveTicket,
  getAppSettings,
  getAppSetting,
  upsertAppSetting,
  verifyUser,
  getAllAdminAccounts,
  updateAdminPanel,
  updateAdminCredentialsFull,
  getAllLoveStories,
  deleteLoveStory,
  updateLoveStory,
  getAllAnnouncements,
  deleteAnnouncement,
  getChatroomMessagesAdmin,
  deleteChatroomMessage,
  getUsersWithDetails,
  getPremiumPaymentsList,
  updateAnnouncementById,
  forceCancelUserPremium,
  clearAllAnnouncementsDb,
  getAllAdminHashedPins,
  getUnreadMessageCount,
  getRealNotificationCount,
  getAllConversationPartners,
  getActionCounts,
  getChatroomInfo,
  createNotification,
  getUnreadNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount,
  markMessagesAsRead,
  getUnreadCountForRoom,
  recordSwipe,
  getUserByEmail,
  createLocalUser,
  touchUserLogin,
  createEmailVerificationToken,
  verifyEmailWithToken,
  createPasswordResetToken,
  resetPasswordWithToken,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { createAuthToken, createOneTimeToken, hashOneTimeToken, hashPassword, verifyPassword } from "./auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { checkLoginRateLimit, clearLoginAttempts, recordFailedLogin } from "./rate-limit";

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
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2).max(64).optional() }))
      .mutation(async ({ input }) => {
        try {
          const email = input.email.trim().toLowerCase();
          if (await getUserByEmail(email)) {
            throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
          }
          const user = await createLocalUser({ email, passwordHash: await hashPassword(input.password), name: input.name?.trim() });
          const verificationToken = createOneTimeToken();
          await createEmailVerificationToken(user.id, hashOneTimeToken(verificationToken), new Date(Date.now() + 24 * 60 * 60 * 1000));
          let verificationDelivered = false;
          try {
            verificationDelivered = (await sendVerificationEmail(email, verificationToken)).delivered;
          } catch (emailError) {
            console.error("[Auth] Verification email delivery failed:", emailError);
          }
          return { token: await createAuthToken(user.id), user, verificationDelivered };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Auth] Registration failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account creation is temporarily unavailable. Please try again." });
        }
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const email = input.email.trim().toLowerCase();
        const key = `${ctx.req.ip ?? "unknown"}:${email}`;
        const rate = checkLoginRateLimit(key);
        if (!rate.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many failed attempts. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` });
        }
        try {
          const user = await getUserByEmail(email);
          if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
            recordFailedLogin(key);
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
          }
          if (user.isBanned) {
            recordFailedLogin(key);
            throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended." });
          }
          clearLoginAttempts(key);
          await touchUserLogin(user.id);
          return { token: await createAuthToken(user.id), user };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Auth] Login failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Login is temporarily unavailable. Please try again." });
        }
      }),
    requestPasswordReset: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        try {
          const user = await getUserByEmail(input.email.trim().toLowerCase());
          if (user?.email && user.passwordHash) {
            const token = createOneTimeToken();
            await createPasswordResetToken(user.id, hashOneTimeToken(token), new Date(Date.now() + 60 * 60 * 1000));
            try {
              await sendPasswordResetEmail(user.email, token);
            } catch (error) {
              console.error("[Auth] Password reset email delivery failed:", error);
            }
          }
        } catch (error) {
          console.error("[Auth] Password reset request failed:", error);
        }
        return { success: true, message: "If an account exists for that email, reset instructions have been sent." } as const;
      }),
    resetPassword: publicProcedure
      .input(z.object({ token: z.string().min(32), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        try {
          const success = await resetPasswordWithToken(hashOneTimeToken(input.token), await hashPassword(input.password));
          if (!success) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link is invalid or has expired." });
          return { success: true } as const;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Auth] Password reset failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Password reset is temporarily unavailable. Please try again." });
        }
      }),
    verifyEmail: publicProcedure
      .input(z.object({ token: z.string().min(32) }))
      .mutation(async ({ input }) => {
        try {
          const success = await verifyEmailWithToken(hashOneTimeToken(input.token));
          if (!success) throw new TRPCError({ code: "BAD_REQUEST", message: "This verification link is invalid or has expired." });
          return { success: true } as const;
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[Auth] Email verification failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email verification is temporarily unavailable. Please try again." });
        }
      }),
    resendVerification: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        try {
          const user = await getUserByEmail(input.email.trim().toLowerCase());
          if (user?.email && !user.emailVerified && user.passwordHash) {
            const token = createOneTimeToken();
            await createEmailVerificationToken(user.id, hashOneTimeToken(token), new Date(Date.now() + 24 * 60 * 60 * 1000));
            try {
              await sendVerificationEmail(user.email, token);
            } catch (error) {
              console.error("[Auth] Verification email delivery failed:", error);
            }
          }
        } catch (error) {
          console.error("[Auth] Verification resend failed:", error);
        }
        return { success: true, message: "If your account needs verification, a new link has been sent." } as const;
      }),
    // Login with username + password (no PIN required)
    adminPortalLogin: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const key = `admin:${ctx.req.ip ?? "unknown"}:${input.username.trim().toLowerCase()}`;
        const rate = checkLoginRateLimit(key);
        if (!rate.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many failed attempts. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` });
        const bcrypt = await import("bcryptjs");
        const admin = await getAdminByUsername(input.username);
        if (!admin || !admin.adminPasswordHash) {
          recordFailedLogin(key);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        const passwordOk = await bcrypt.compare(input.password, admin.adminPasswordHash);
        if (!passwordOk) {
          recordFailedLogin(key);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        clearLoginAttempts(key);
        return { success: true, adminPanel: admin.adminPanel ?? "users", token: await createAuthToken(admin.id) } as const;
      }),
    // Login with PIN only (no username/password required)
    adminPortalLoginByPin: publicProcedure
      .input(z.object({ pin: z.string().length(4).regex(/^\d{4}$/) }))
      .mutation(async ({ input, ctx }) => {
        const key = `admin-pin:${ctx.req.ip ?? "unknown"}`;
        const rate = checkLoginRateLimit(key);
        if (!rate.allowed) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many failed attempts. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` });
        const bcrypt = await import("bcryptjs");
        const admins = await getAllAdminHashedPins();
        let matched: typeof admins[0] | null = null;
        for (const a of admins) {
          if (a.adminPin && await bcrypt.compare(input.pin, a.adminPin)) {
            matched = a;
            break;
          }
        }
        if (!matched) {
          recordFailedLogin(key);
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
        }
        clearLoginAttempts(key);
        return { success: true, adminPanel: matched.adminPanel ?? "users", token: await createAuthToken(matched.id) } as const;
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
        amount: 50, // K50 first month, K100 after
        renewalAmount: 100,
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

    // Swipe/Discover list with filter chips
    swipeList: protectedProcedure
      .input(
        z.object({
          filter: z.enum(["all", "online", "new", "nearby"]).default("all"),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended." });
        // Mark current user as online
        await setUserOnline(ctx.user.id, true);
        const user = await getUserById(ctx.user.id);
        const list = await browseSwipeList(
          ctx.user.id,
          input.filter,
          user?.location ?? null,
          20,
          input.offset
        );
        return list;
      }),

    locations: protectedProcedure.query(async () => {
      return getDistinctLocations();
    }),

    recordLike: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        await recordSwipe(ctx.user.id, input.targetId, "like");
        await createNotification({
          userId: input.targetId,
          type: "like",
          title: "New Like",
          content: `${ctx.user.name} liked your profile!`,
          relatedUserId: ctx.user.id,
        });
        return { success: true };
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
        await createNotification({
          userId: input.targetId,
          type: "message",
          title: "New Message",
          content: `${ctx.user.name} sent you a message`,
          relatedUserId: ctx.user.id,
        });
        return msg;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ targetId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const unlock = await getChatUnlock(ctx.user.id, input.targetId);
        if (!unlock)
          throw new TRPCError({ code: "FORBIDDEN", message: "Chat not unlocked." });
        const roomId = buildRoomId(ctx.user.id, input.targetId);
        await markMessagesAsRead(roomId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Payments ─────────────────────────────────────────────────────────────
  payment: router({
    // Initiate a premium subscription payment (K50 first month, K100 after)
    initiatePremium: protectedProcedure
      .input(z.object({ provider: z.enum(["mtn", "airtel", "visa", "mock"]), phone: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned) throw new TRPCError({ code: "FORBIDDEN" });
        if (ctx.user.isPremium) throw new TRPCError({ code: "BAD_REQUEST", message: "Already a premium member." });
        // K50 for first month, K100 recurring — charge K50 now
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

    // Initiate a single-chat unlock payment (K20)
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
          amount: 20,
          provider: input.provider,
          status: "pending",
        });
        await createNotification({
          userId: input.targetId,
          type: "chat_request",
          title: "New Chat Request",
          content: `${ctx.user.name} sent you a chat request. Unlock to reply!`,
          relatedUserId: ctx.user.id,
        });
        return { paymentId: id, amount: 20, provider: input.provider };
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

  // ─── Chatroom ─────────────────────────────────────────────────────────────
  chatroom: router({
    // Get messages for the community chatroom, optionally filtered by category
    messages: protectedProcedure
      .input(
        z.object({
          category: z.string().nullable().optional(),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended." });
        const msgs = await getChatroomMessages(input.category ?? null, 40, input.offset);
        // Fetch reactions for all returned messages
        const ids = msgs.map((m) => m.id);
        const reactions = await getMessageReactions(ids);
        return msgs.reverse().map((msg) => ({
          ...msg,
          reactions: reactions.filter((r) => r.messageId === msg.id),
        }));
      }),

    // Post a new message to the community chatroom
    post: protectedProcedure
      .input(
        z.object({
          content: z.string().min(1).max(1000),
          messageType: z.enum(["general", "bible_verse", "testimony", "prayer_request", "counseling"]).default("general"),
          category: z.enum(["general", "counseling", "testimonies", "bible_verse", "prayer_requests", "prayer_sessions"]).default("general"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN", message: "Your account has been suspended." });
        const msg = await postChatroomMessage({
          userId: ctx.user.id,
          content: input.content,
          messageType: input.messageType,
          category: input.category,
        });
        return msg;
      }),

    // Toggle a reaction (heart or pray) on a chatroom message
    react: protectedProcedure
      .input(
        z.object({
          messageId: z.number().int(),
          reactionType: z.enum(["heart", "pray"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.isBanned)
          throw new TRPCError({ code: "FORBIDDEN" });
        return toggleChatroomReaction(input.messageId, ctx.user.id, input.reactionType);
      }),

    // Get approximate online member count
    onlineCount: protectedProcedure.query(async () => {
      return getChatroomOnlineCount();
    }),
  }),

  // ─── Faith & Relationship Profile ─────────────────────────────────────────
  faithProfile: router({
    // Get current user's faith & relationship preference fields
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        denomination: user.denomination,
        faithLevel: user.faithLevel,
        bibleVersion: user.bibleVersion,
        prayerFrequency: user.prayerFrequency,
        church: user.church,
        lookingFor: user.lookingFor,
        ageRangeMin: user.ageRangeMin,
        ageRangeMax: user.ageRangeMax,
        preferredLocation: user.preferredLocation,
      };
    }),

    // Update faith & values fields
    updateFaith: protectedProcedure
      .input(
        z.object({
          denomination: z.string().max(128).optional(),
          faithLevel: z.enum(["growing", "committed", "deeply_rooted"]).optional(),
          bibleVersion: z.string().max(64).optional(),
          prayerFrequency: z.enum(["daily", "weekly", "occasionally"]).optional(),
          church: z.string().max(256).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateFaithProfile(ctx.user.id, input);
        return { success: true };
      }),

    // Update relationship preferences
    updateRelationshipPrefs: protectedProcedure
      .input(
        z.object({
          lookingFor: z.enum(["marriage", "friendship", "dating", "not_sure"]).optional(),
          ageRangeMin: z.number().int().min(18).max(100).optional(),
          ageRangeMax: z.number().int().min(18).max(100).optional(),
          preferredLocation: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await updateRelationshipPrefs(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── Home ────────────────────────────────────────────────────────────────
  home: router({
    suggestedProfiles: protectedProcedure.query(async ({ ctx }) => {
      return getSuggestedProfiles(ctx.user.id, 8);
    }),

    loveStories: protectedProcedure.query(async () => {
      return getLoveStories(10);
    }),

    announcements: protectedProcedure.query(async () => {
      return getAnnouncements(10);
    }),

    notifications: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsForUser(ctx.user.id);
    }),
    unreadMessageCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadMessageCount(ctx.user.id);
      return { count };
    }),
    notificationCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getRealNotificationCount(ctx.user.id);
      return { count };
    }),
    allConversations: protectedProcedure.query(async ({ ctx }) => {
      return getAllConversationPartners(ctx.user.id);
    }),
    actionCounts: protectedProcedure.query(async ({ ctx }) => {
      return getActionCounts(ctx.user.id);
    }),
    chatroomInfo: protectedProcedure.query(async () => {
      return getChatroomInfo();
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

    createAnnouncement: adminProcedure
      .input(z.object({ title: z.string().min(1).max(256), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return createAnnouncement({ title: input.title, content: input.content, adminId: ctx.user.id });
      }),

     createLoveStory: adminProcedure
      .input(z.object({
        coupleName: z.string().min(1).max(256),
        location: z.string().min(1).max(256),
        quoteTitle: z.string().min(1),
        story: z.string().min(1),
        photoUrl: z.string().optional(),
        photoKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createLoveStory(input);
      }),
    // ── Finance Admin ──────────────────────────────────────────────────────
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),
    allPayments: adminProcedure.query(async () => {
      return getPremiumPaymentsList();
    }),
    getPendingManualPayments: adminProcedure.query(async () => {
      return [] as { id: number; amount: number; provider: string; createdAt: Date }[];
    }),
    approveManualPayment: adminProcedure
      .input(z.object({ paymentId: z.number().int() }))
      .mutation(async ({ input }) => {
        const unlock = await getPendingUnlockById(input.paymentId, 0);
        if (!unlock) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });
        if (unlock.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Payment already processed" });
        
        const reference = `MAN-${nanoid(12).toUpperCase()}`;
        await completeChatUnlock(input.paymentId, reference);
        await setUserPremium(unlock.payerId, true);
        return { success: true, reference };
      }),
    // ── Support Admin ──────────────────────────────────────────────────────
    supportTickets: adminProcedure.query(async () => {
      return getAllSupportTickets();
    }),
    resolveTicket: adminProcedure
      .input(z.object({
        ticketId: z.number().int(),
        reply: z.string().min(1),
        status: z.enum(["in_progress", "resolved", "closed"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await resolveTicket(input.ticketId, ctx.user.id, input.reply, input.status);
        return { success: true };
      }),
    chatroomMessages: adminProcedure.query(async () => {
      return getChatroomMessagesAdmin(200);
    }),
    deleteChatroomMessage: adminProcedure
      .input(z.object({ messageId: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteChatroomMessage(input.messageId);
        return { success: true };
      }),
    // ── Systems & Settings Admin ───────────────────────────────────────────
    appSettings: adminProcedure.query(async () => {
      return getAppSettings();
    }),
    updateSetting: adminProcedure
      .input(z.object({ key: z.string().min(1), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertAppSetting(input.key, input.value, ctx.user.id);
        return { success: true };
      }),
    // ── User Management Admin ──────────────────────────────────────────────
    usersDetailed: adminProcedure.query(async () => {
      return getUsersWithDetails();
    }),
    verifyUser: adminProcedure
      .input(z.object({ userId: z.number().int(), verified: z.boolean() }))
      .mutation(async ({ input }) => {
        await verifyUser(input.userId, input.verified);
        return { success: true };
      }),
    setPremium: adminProcedure
      .input(z.object({ userId: z.number().int(), isPremium: z.boolean() }))
      .mutation(async ({ input }) => {
        await setUserPremium(input.userId, input.isPremium);
        return { success: true };
      }),
    // ── Announcement Center ────────────────────────────────────────────────
    allAnnouncements: adminProcedure.query(async () => {
      return getAllAnnouncements();
    }),
    deleteAnnouncement: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncement(input.id);
        return { success: true };
      }),
    allLoveStories: adminProcedure.query(async () => {
      return getAllLoveStories();
    }),
    deleteLoveStory: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteLoveStory(input.id);
        return { success: true };
      }),
    updateLoveStory: adminProcedure
      .input(z.object({
        id: z.number().int(),
        coupleName: z.string().optional(),
        location: z.string().optional(),
        quoteTitle: z.string().optional(),
        story: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateLoveStory(id, data);
        return { success: true };
      }),
    // ── Role & Credentials Management ─────────────────────────────────────
    allAdmins: adminProcedure.query(async () => {
      return getAllAdminAccounts();
    }),
    updateAdminCredentials: adminProcedure
      .input(z.object({
        userId: z.number().int(),
        adminUsername: z.string().min(1).max(64).optional(),
        newPassword: z.string().min(6).optional(),
        newPin: z.string().length(4).regex(/^\d{4}$/).optional(),
        adminPanel: z.enum(["finance", "support", "systems", "users", "announcements", "roles", "super"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const bcrypt = await import("bcryptjs");
        const updates: { adminUsername?: string; adminPasswordHash?: string; adminPin?: string; adminPanel?: string } = {};
        if (input.adminUsername) updates.adminUsername = input.adminUsername;
        if (input.newPassword) updates.adminPasswordHash = await bcrypt.hash(input.newPassword, 10);
        if (input.newPin) updates.adminPin = await bcrypt.hash(input.newPin, 10);
        if (input.adminPanel) updates.adminPanel = input.adminPanel;
        await updateAdminCredentialsFull(input.userId, updates);
        return { success: true };
      }),
    updateAnnouncement: adminProcedure
      .input(z.object({
        id: z.number().int(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const updates: { title?: string; content?: string } = {};
        if (input.title) updates.title = input.title;
        if (input.content) updates.content = input.content;
        await updateAnnouncementById(input.id, updates);
        return { success: true };
      }),
    forceCancelPremium: adminProcedure
      .input(z.object({ userId: z.number().int() }))
      .mutation(async ({ input }) => {
        await forceCancelUserPremium(input.userId);
        return { success: true };
      }),
    clearAllAnnouncements: adminProcedure
      .mutation(async () => {
        await clearAllAnnouncementsDb();
        return { success: true };
      }),
    promoteToAdmin: adminProcedure
      .input(z.object({
        userId: z.number().int(),
        adminUsername: z.string().min(1).max(64),
        password: z.string().min(6),
        pin: z.string().length(4).regex(/^\d{4}$/),
        adminPanel: z.enum(["finance", "support", "systems", "users", "announcements", "roles", "super"]),
      }))
      .mutation(async ({ input }) => {
        const bcrypt = await import("bcryptjs");
        const passwordHash = await bcrypt.hash(input.password, 10);
        const pinHash = await bcrypt.hash(input.pin, 10);
        await updateAdminCredentialsFull(input.userId, {
          adminUsername: input.adminUsername,
          adminPasswordHash: passwordHash,
          adminPin: pinHash,
          adminPanel: input.adminPanel,
        });
        // Also set role to admin
        const { db: _db } = await import("./db").then(m => ({ db: m.getDb }));
        const db = await _db();
        if (db) {
          const { users: usersTable } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, input.userId));
        }
        return { success: true };
      }),
  }),

  // ─── Notifications ────────────────────────────────────────────────────────
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await getUnreadNotifications(ctx.user.id);
      return { notifications };
    }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number().int() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),
    count: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    }),
  }),
});
export type AppRouter = typeof appRouter;
