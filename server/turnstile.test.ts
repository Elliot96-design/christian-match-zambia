import { afterEach, describe, expect, it, vi } from "vitest";
import { isTurnstileConfigured, verifyTurnstileToken } from "./turnstile";

describe("Turnstile verification", () => {
  const previousSecret = process.env.TURNSTILE_SECRET_KEY;

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = previousSecret;
    vi.restoreAllMocks();
  });

  it("allows local development when no secret is configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileConfigured()).toBe(false);
    expect(await verifyTurnstileToken(undefined)).toBe(true);
  });

  it("rejects a failed provider response", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) }));
    expect(await verifyTurnstileToken("bad-token", "127.0.0.1")).toBe(false);
  });
});
