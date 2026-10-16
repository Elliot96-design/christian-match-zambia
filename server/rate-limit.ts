type Attempt = { count: number; resetAt: number };

const attempts = new Map<string, Attempt>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const CAPTCHA_AFTER_ATTEMPTS = 3;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) return { allowed: true, requiresCaptcha: false, retryAfterSeconds: 0 };
  return { allowed: current.count < MAX_ATTEMPTS, requiresCaptcha: current.count >= CAPTCHA_AFTER_ATTEMPTS, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    current.count += 1;
  }
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}

export function resetRateLimitStateForTests() {
  attempts.clear();
}
