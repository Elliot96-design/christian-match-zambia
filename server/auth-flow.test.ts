import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyAuthToken } from "./auth";
import { resetRateLimitStateForTests } from "./rate-limit";

const dbMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createLocalUser: vi.fn(),
  createEmailVerificationToken: vi.fn(),
}));

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, ...dbMocks };
});

vi.mock("./email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ delivered: false }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ delivered: false }),
}));

function context(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", ip: "127.0.0.1", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const user = {
  id: 42,
  openId: "local_test_42",
  name: "Test User",
  email: "test@example.com",
  phone: null,
  passwordHash: "",
  emailVerified: false,
  loginMethod: "password",
  role: "user" as const,
  profileComplete: false,
  isBanned: false,
  isPremium: false,
  premiumSince: null,
  premiumExpiresAt: null,
  age: null,
  gender: null,
  location: null,
  church: null,
  bio: null,
  photoUrl: null,
  photoKey: null,
  denomination: null,
  faithLevel: null,
  bibleVersion: null,
  prayerFrequency: null,
  lookingFor: null,
  ageRangeMin: null,
  ageRangeMax: null,
  preferredLocation: null,
  isOnline: false,
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

describe("email/password auth flow", () => {
  beforeEach(async () => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
    user.passwordHash = await hashPassword("correct-password");
    dbMocks.getUserByEmail.mockResolvedValue(undefined);
    dbMocks.createLocalUser.mockResolvedValue({ ...user });
    dbMocks.createEmailVerificationToken.mockResolvedValue(undefined);
  });

  it("registers a user, issues a JWT, and stores a hashed verification token", async () => {
    const result = await appRouter.createCaller(context()).auth.register({
      email: "Test@Example.com",
      password: "correct-password",
      name: "Test User",
    });

    expect(result.user.email).toBe("test@example.com");
    expect(result.token).toBeTruthy();
    expect(await verifyAuthToken(result.token)).toEqual({ userId: 42 });
    expect(dbMocks.createEmailVerificationToken).toHaveBeenCalledWith(42, expect.stringMatching(/^[a-f0-9]{64}$/), expect.any(Date));
  });

  it("logs in with the registered password and rejects repeated failures", async () => {
    dbMocks.getUserByEmail.mockResolvedValue({ ...user });
    const caller = appRouter.createCaller(context());
    const result = await caller.auth.login({ email: "TEST@example.com", password: "correct-password" });
    expect(result.user.id).toBe(42);
    expect(await verifyAuthToken(result.token)).toEqual({ userId: 42 });

    const wrongHash = await hashPassword("different-password");
    for (let i = 0; i < 8; i++) {
      dbMocks.getUserByEmail.mockResolvedValue({ ...user, passwordHash: wrongHash });
      await expect(caller.auth.login({ email: "TEST@example.com", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    }
    await expect(caller.auth.login({ email: "TEST@example.com", password: "wrong-password" })).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
