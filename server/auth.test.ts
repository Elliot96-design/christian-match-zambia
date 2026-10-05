import { describe, expect, it } from "vitest";
import { createAuthToken, hashPassword, verifyAuthToken, verifyPassword } from "./auth";

describe("standalone authentication", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("issues a JWT that resolves to the user id and rejects tampering", async () => {
    const token = await createAuthToken(42);
    expect(await verifyAuthToken(token)).toEqual({ userId: 42 });
    expect(await verifyAuthToken(`${token}tampered`)).toBeNull();
  });
});
