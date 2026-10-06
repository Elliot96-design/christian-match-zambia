export function readableAuthError(error: unknown, mode: "login" | "signup") {
  const fallback = mode === "signup" ? "Unable to create your account. Please try again." : "Unable to log in. Please try again.";
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  try {
    const parsed = JSON.parse(message) as { message?: string; issues?: unknown };
    if (typeof parsed.message === "string") return parsed.message;
    if (Array.isArray(parsed)) {
      const first = parsed[0] as { message?: string } | undefined;
      if (first?.message) return first.message;
    }
    if (Array.isArray(parsed.issues)) {
      const first = parsed.issues[0] as { message?: string } | undefined;
      if (first?.message) return first.message;
    }
  } catch {
    // Normal tRPC errors are already readable strings.
  }
  return message || fallback;
}
