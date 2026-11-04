import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getChatUnlock: vi.fn(),
  getExistingChatPayment: vi.fn(),
  getPaymentByTransactionId: vi.fn(),
  getUserById: vi.fn(),
  getAppSetting: vi.fn(),
  createChatUnlock: vi.fn(),
  completeChatUnlock: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

const user = {
  id: 10,
  openId: "local_payment_test",
  name: "Payer",
  email: "payer@example.com",
  phone: null,
  passwordHash: null,
  emailVerified: true,
  loginMethod: "password",
  role: "user" as const,
  profileComplete: true,
  isBanned: false,
  isPremium: false,
  premiumSince: null,
  premiumExpiresAt: null,
  age: 30,
  gender: "male" as const,
  location: "Lusaka",
  church: null,
  bio: null,
  photoUrl: null,
  photoKey: null,
  denomination: null,
  faithLevel: null,
  bibleVersion: null,
  prayerFrequency: null,
  lookingFor: "dating" as const,
  ageRangeMin: 20,
  ageRangeMax: 40,
  preferredLocation: null,
  isOnline: true,
  lastSeen: new Date(),
  occupation: null,
  isVerified: false,
  adminUsername: null,
  adminPasswordHash: null,
  adminPin: null,
  adminPanel: "users" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function context(): TrpcContext {
  return {
    user,
    req: { protocol: "https", ip: "127.0.0.1", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("manual chat payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getChatUnlock.mockResolvedValue(undefined);
    dbMocks.getExistingChatPayment.mockResolvedValue(undefined);
    dbMocks.getPaymentByTransactionId.mockResolvedValue(undefined);
    dbMocks.getUserById.mockResolvedValue({ ...user, id: 20, name: "Target" });
    dbMocks.createChatUnlock.mockResolvedValue(99);
    dbMocks.getAppSetting.mockImplementation(async (key: string) => {
      if (key === "payment_mtn_enabled") return "true";
      if (key === "chat_unlock_amount") return "20";
      if (key === "payment_currency") return "ZMW";
      return null;
    });
  });

  it("creates a pending payment and never completes it from the client", async () => {
    const caller = appRouter.createCaller(context());
    const result = await caller.payment.initiate({
      targetId: 20,
      provider: "mtn",
      transactionId: "MTN-TEST-123",
      senderPhone: "0960000000",
    });
    expect(result.status).toBe("pending");
    expect(dbMocks.createChatUnlock).toHaveBeenCalledWith(expect.objectContaining({
      status: "pending",
      amount: 20,
      currency: "ZMW",
      transactionId: "MTN-TEST-123",
    }));
    await expect(caller.payment.confirm({ paymentId: 99 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMocks.completeChatUnlock).not.toHaveBeenCalled();
  });

  it("rejects a reused transaction ID before creating another payment", async () => {
    dbMocks.getPaymentByTransactionId.mockResolvedValue({ id: 1, transactionId: "USED-1" });
    await expect(appRouter.createCaller(context()).payment.initiate({
      targetId: 20,
      provider: "mtn",
      transactionId: "USED-1",
    })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(dbMocks.createChatUnlock).not.toHaveBeenCalled();
  });
});
