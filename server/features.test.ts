import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getChatUnlock: vi.fn(),
  createChatUnlock: vi.fn(),
  completeChatUnlock: vi.fn(),
  getPendingUnlockById: vi.fn(),
  getUserById: vi.fn(),
  banUser: vi.fn(),
  getAllUsers: vi.fn(),
  getAllPayments: vi.fn(),
  buildRoomId: (a: number, b: number) => [a, b].sort((x, y) => x - y).join("_"),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  browseUsers: vi.fn(),
  getDistinctLocations: vi.fn(),
  updateUserProfile: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  setUserPremium: vi.fn(),
  hasAnyCompletedUnlock: vi.fn(),
  getUserPhotos: vi.fn(),
  countUserPhotos: vi.fn(),
  getMyUnlockedChats: vi.fn(),
  createPremiumPayment: vi.fn(),
  getUnreadNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markMessagesAsRead: vi.fn(),
  getUnreadCountForRoom: vi.fn(),
  createNotification: vi.fn(),
  recordSwipe: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn(),
}));

import * as db from "./db";

function makeCtx(overrides: Partial<TrpcContext["user"]> = {}): TrpcContext {
  const user: TrpcContext["user"] = {
    id: 1,
    openId: "user-1",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    age: 25,
    gender: "male",
    location: "Lusaka",
    church: "UCZA",
    bio: "Hello",
    photoUrl: null,
    photoKey: null,
    profileComplete: true,
    isBanned: false,
    phone: null,
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return makeCtx({ id: 99, openId: "admin-1", role: "admin" });
}

describe("chat.checkUnlock", () => {
  it("returns unlocked=false when no unlock record exists", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.checkUnlock({ targetId: 2 });
    expect(result.unlocked).toBe(false);
  });

  it("returns unlocked=true when unlock record exists", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue({
      id: 1, payerId: 1, targetId: 2, status: "completed",
      amount: 10, provider: "mock", reference: "REF123",
      createdAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.checkUnlock({ targetId: 2 });
    expect(result.unlocked).toBe(true);
  });
});

describe("chat.messages - server-side enforcement", () => {
  it("throws FORBIDDEN when chat not unlocked", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.chat.messages({ targetId: 2 })).rejects.toThrow();
  });

  it("returns messages when chat is unlocked", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue({
      id: 1, payerId: 1, targetId: 2, status: "completed",
      amount: 10, provider: "mock", reference: "REF123",
      createdAt: new Date(),
    });
    vi.mocked(db.getMessages).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.messages({ targetId: 2 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("payment.initiate", () => {
  it("creates a pending payment record", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue(undefined);
    vi.mocked(db.getUserById).mockResolvedValue({
      id: 2, openId: "user-2", name: "Target", email: null, phone: null,
      loginMethod: null, role: "user", age: 22, gender: "female",
      location: "Kitwe", church: "UCZ", bio: null, photoUrl: null,
      photoKey: null, profileComplete: true, isBanned: false,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    });
    vi.mocked(db.createChatUnlock).mockResolvedValue(42);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.payment.initiate({ targetId: 2, provider: "mock" });
    expect(result.paymentId).toBe(42);
    expect(result.amount).toBe(20);
  });

  it("throws if chat already unlocked", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue({
      id: 1, payerId: 1, targetId: 2, status: "completed",
      amount: 10, provider: "mock", reference: "REF",
      createdAt: new Date(),
    });
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.payment.initiate({ targetId: 2, provider: "mock" })).rejects.toThrow();
  });
});

describe("payment.confirm", () => {
  it("completes the payment with a reference", async () => {
    vi.mocked(db.getPendingUnlockById).mockResolvedValue({
      id: 1, payerId: 1, targetId: 2, status: "pending",
      amount: 10, provider: "mock", reference: null,
      createdAt: new Date(),
    });
    vi.mocked(db.completeChatUnlock).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.payment.confirm({ paymentId: 1, mockReference: "TEST-REF" });
    expect(result.success).toBe(true);
    expect(result.reference).toBe("TEST-REF");
  });

  it("throws FORBIDDEN when payment does not belong to user", async () => {
    vi.mocked(db.getPendingUnlockById).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.payment.confirm({ paymentId: 99 })).rejects.toThrow();
  });
});

describe("admin.banUser", () => {
  it("allows admin to ban a user", async () => {
    vi.mocked(db.banUser).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.banUser({ userId: 5, ban: true });
    expect(result.success).toBe(true);
    expect(db.banUser).toHaveBeenCalledWith(5, true);
  });

  it("throws FORBIDDEN for non-admin users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.banUser({ userId: 5, ban: true })).rejects.toThrow();
  });
});

describe("admin.users", () => {
  it("returns all users for admin", async () => {
    vi.mocked(db.getAllUsers).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.admin.users();
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.admin.users()).rejects.toThrow();
  });
});

describe("profile.getPlanDetails", () => {
  it("returns isPremium=false and null planType for non-premium user", async () => {
    const now = new Date();
    vi.mocked(db.getUserById).mockResolvedValue({
      id: 1, openId: "user-1", name: "Test", email: null, phone: null,
      loginMethod: null, role: "user", age: 25, gender: "male",
      location: "Lusaka", church: "UCZ", bio: null, photoUrl: null,
      photoKey: null, profileComplete: true, isBanned: false,
      isPremium: false, premiumSince: null,
      createdAt: now, updatedAt: now, lastSignedIn: now,
    });
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.profile.getPlanDetails();
    expect(result.isPremium).toBe(false);
    expect(result.planType).toBeNull();
    expect(result.renewalDate).toBeNull();
  });

  it("returns correct renewal date (premiumSince + 30 days) for premium user", async () => {
    const premiumSince = new Date("2026-01-01T00:00:00Z");
    const expectedRenewal = new Date("2026-01-31T00:00:00Z");
    vi.mocked(db.getUserById).mockResolvedValue({
      id: 1, openId: "user-1", name: "Test", email: null, phone: null,
      loginMethod: null, role: "user", age: 25, gender: "male",
      location: "Lusaka", church: "UCZ", bio: null, photoUrl: null,
      photoKey: null, profileComplete: true, isBanned: false,
      isPremium: true, premiumSince,
      createdAt: premiumSince, updatedAt: premiumSince, lastSignedIn: premiumSince,
    });
    const caller = appRouter.createCaller(makeCtx({ isPremium: true }));
    const result = await caller.profile.getPlanDetails();
    expect(result.isPremium).toBe(true);
    expect(result.planType).toBe("Premium Monthly");
    expect(result.renewalDate?.getTime()).toBe(expectedRenewal.getTime());
    expect(result.benefits.length).toBeGreaterThan(0);
  });
});

describe("profile.cancelPremium", () => {
  it("cancels premium and calls setUserPremium(false)", async () => {
    vi.mocked(db.setUserPremium).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx({ isPremium: true }));
    const result = await caller.profile.cancelPremium();
    expect(result.success).toBe(true);
    expect(db.setUserPremium).toHaveBeenCalledWith(1, false);
  });

  it("throws BAD_REQUEST if user is not premium", async () => {
    const caller = appRouter.createCaller(makeCtx({ isPremium: false }));
    await expect(caller.profile.cancelPremium()).rejects.toThrow();
  });
});


describe("notification.list", () => {
  it("returns empty array when no notifications", async () => {
    vi.mocked(db.getUnreadNotifications).mockResolvedValue([]);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notification.list();
    expect(result.notifications).toEqual([]);
  });

  it("returns unread notifications for user", async () => {
    const mockNotifications = [
      {
        id: 1,
        userId: 1,
        type: "like" as const,
        title: "New Like",
        content: "Someone liked your profile",
        relatedUserId: 2,
        isRead: false,
        createdAt: new Date(),
      },
    ];
    vi.mocked(db.getUnreadNotifications).mockResolvedValue(mockNotifications);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notification.list();
    expect(result.notifications).toHaveLength(1);
    expect(result.notifications[0].type).toBe("like");
  });
});

describe("notification.markAsRead", () => {
  it("marks notification as read", async () => {
    vi.mocked(db.markNotificationAsRead).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notification.markAsRead({ notificationId: 1 });
    expect(result.success).toBe(true);
    expect(db.markNotificationAsRead).toHaveBeenCalledWith(1);
  });
});

describe("notification.count", () => {
  it("returns unread notification count", async () => {
    vi.mocked(db.getUnreadNotificationCount).mockResolvedValue(3);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notification.count();
    expect(result.count).toBe(3);
  });
});

describe("chat.markAsRead", () => {
  it("marks messages as read in a chat room", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue({
      id: 1, payerId: 1, targetId: 2, status: "completed",
      amount: 20, provider: "mtn", createdAt: new Date(),
    });
    vi.mocked(db.markMessagesAsRead).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.chat.markAsRead({ targetId: 2 });
    expect(result.success).toBe(true);
    expect(db.markMessagesAsRead).toHaveBeenCalledWith("1_2", 1);
  });

  it("throws FORBIDDEN if chat not unlocked", async () => {
    vi.mocked(db.getChatUnlock).mockResolvedValue(null);
    const caller = appRouter.createCaller(makeCtx());
    await expect(caller.chat.markAsRead({ targetId: 2 })).rejects.toThrow();
  });
});
