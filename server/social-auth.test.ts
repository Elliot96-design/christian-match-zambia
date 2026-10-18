import { describe, expect, it } from "vitest";
import { consumeSocialLoginCode, createSocialAuthorizationUrl, isSocialProviderConfigured, issueSocialLoginCode } from "./social-auth";

describe("social authentication safeguards", () => {
  it("does not start Google auth without provider credentials", () => {
    expect(isSocialProviderConfigured("google")).toBe(false);
    expect(() => createSocialAuthorizationUrl("google")).toThrow(/not configured/);
  });

  it("consumes the frontend exchange code exactly once", () => {
    const code = issueSocialLoginCode(123);
    expect(consumeSocialLoginCode(code)).toEqual({ userId: 123, createdAt: expect.any(Number) });
    expect(consumeSocialLoginCode(code)).toBeUndefined();
  });
});
