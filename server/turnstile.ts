const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstileToken(token: string | undefined, remoteip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteip && remoteip !== "unknown") body.set("remoteip", remoteip);
  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("[Security] Turnstile verification failed:", error);
    return false;
  }
}
