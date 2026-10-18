import type { Express, Request, Response } from "express";
import { createSocialUser, getSocialAccount, getUserByEmail, getUserById, recordSecurityEvent } from "./db";
import { consumeOAuthState, createSocialAuthorizationUrl, isSocialProviderConfigured, issueSocialLoginCode, verifySocialCode, type SocialProvider } from "./social-auth";

function provider(value: string): SocialProvider | undefined {
  return value === "google" || value === "apple" ? value : undefined;
}

function loginUrl(req: Request, params: Record<string, string>) {
  const origin = process.env.APP_URL ?? `${req.protocol}://${req.get("host")}`;
  const query = new URLSearchParams(params);
  return `${origin}/login?${query}`;
}

async function completeCallback(req: Request, res: Response, socialProvider: SocialProvider, code: string, stateValue: string, appleUser?: string) {
  const state = consumeOAuthState(stateValue, socialProvider);
  if (!state) return res.redirect(loginUrl(req, { social_error: "Authentication expired. Please try again." }));
  try {
    const identity = await verifySocialCode(code, state, appleUser);
    const linked = await getSocialAccount(identity.provider, identity.providerAccountId);
    let user = linked ? await getUserById(linked.userId) : undefined;
    if (!user) {
      const existing = await getUserByEmail(identity.email);
      if (existing) {
        void recordSecurityEvent({ action: "social_login_link_required", userId: existing.id, email: identity.email, ipAddress: req.ip, metadata: { provider: identity.provider } });
        return res.redirect(loginUrl(req, { social_error: `This email already has an account. Log in with your password first, then link ${identity.provider}.` }));
      }
      user = await createSocialUser(identity);
    }
    void recordSecurityEvent({ action: "social_login_success", userId: user.id, email: identity.email, ipAddress: req.ip, metadata: { provider: identity.provider } });
    const socialCode = issueSocialLoginCode(user.id);
    return res.redirect(loginUrl(req, { social_code: socialCode }));
  } catch (error) {
    console.error(`[SocialAuth:${socialProvider}] callback failed:`, error);
    void recordSecurityEvent({ action: "social_login_failed", ipAddress: req.ip, metadata: { provider: socialProvider } });
    return res.redirect(loginUrl(req, { social_error: "Social sign-in could not be completed. Please try again." }));
  }
}

export function registerSocialAuthRoutes(app: Express) {
  app.get("/api/auth/social/:provider/start", (req, res) => {
    const socialProvider = provider(req.params.provider);
    if (!socialProvider || !isSocialProviderConfigured(socialProvider)) return res.redirect(loginUrl(req, { social_error: `${req.params.provider} sign-in is not configured yet.` }));
    try {
      res.redirect(createSocialAuthorizationUrl(socialProvider, typeof req.query.returnPath === "string" ? req.query.returnPath : "/browse"));
    } catch (error) {
      console.error("Social auth start failed:", error);
      res.redirect(loginUrl(req, { social_error: "Social sign-in is temporarily unavailable." }));
    }
  });

  app.get("/api/auth/social/google/callback", (req, res) => {
    if (typeof req.query.code !== "string" || typeof req.query.state !== "string") return res.redirect(loginUrl(req, { social_error: "Google authentication was cancelled." }));
    void completeCallback(req, res, "google", req.query.code, req.query.state);
  });

  app.post("/api/auth/social/apple/callback", (req, res) => {
    if (typeof req.body?.code !== "string" || typeof req.body?.state !== "string") return res.redirect(loginUrl(req, { social_error: "Apple authentication was cancelled." }));
    void completeCallback(req, res, "apple", req.body.code, req.body.state, typeof req.body.user === "string" ? req.body.user : undefined);
  });
}
