import { describe, expect, it, beforeEach } from "vitest";
import { checkLoginRateLimit, clearLoginAttempts, recordFailedLogin, resetRateLimitStateForTests } from "./rate-limit";

describe("login rate limiting", () => {
  beforeEach(() => resetRateLimitStateForTests());

  it("blocks repeated failed attempts and clears a successful account", () => {
    const key = "127.0.0.1:test@example.com";
    for (let i = 0; i < 8; i++) recordFailedLogin(key);
    expect(checkLoginRateLimit(key).allowed).toBe(false);
    clearLoginAttempts(key);
    expect(checkLoginRateLimit(key).allowed).toBe(true);
  });
});
