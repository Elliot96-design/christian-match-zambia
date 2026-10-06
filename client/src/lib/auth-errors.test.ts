import { describe, expect, it } from "vitest";
import { readableAuthError } from "./auth-errors";

describe("readableAuthError", () => {
  it("extracts the first Zod validation message", () => {
    const error = new Error(JSON.stringify([{ message: "Invalid email address" }]));
    expect(readableAuthError(error, "login")).toBe("Invalid email address");
  });

  it("preserves readable server auth messages", () => {
    expect(readableAuthError(new Error("Invalid email or password."), "login")).toBe("Invalid email or password.");
    expect(readableAuthError(new Error(""), "signup")).toBe("Unable to create your account. Please try again.");
  });
});
