import { createHash, randomBytes } from "node:crypto";
import { importPKCS8, createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { createOneTimeToken } from "./auth";

export type SocialProvider = "google" | "apple";
export type SocialIdentity = {
  provider: SocialProvider;
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  photoUrl?: string;
};

type OAuthState = { provider: SocialProvider; codeVerifier: string; createdAt: number; returnPath: string };
type LoginCode = { userId: number; createdAt: number };
const states = new Map<string, OAuthState>();
const loginCodes = new Map<string, LoginCode>();
const STATE_TTL = 10 * 60 * 1000;
const CODE_TTL = 60 * 1000;

function config(provider: SocialProvider) {
  if (provider === "google") {
    return { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, redirectUri: process.env.GOOGLE_REDIRECT_URI };
  }
  return { clientId: process.env.APPLE_CLIENT_ID, clientSecret: undefined, redirectUri: process.env.APPLE_REDIRECT_URI };
}

export function isSocialProviderConfigured(provider: SocialProvider) {
  const current = config(provider);
  if (provider === "google") return Boolean(current.clientId && current.clientSecret && current.redirectUri);
  return Boolean(current.clientId && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY && current.redirectUri);
}

function base64url(value: Buffer) {
  return value.toString("base64url");
}

function createPkce() {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

export function createSocialAuthorizationUrl(provider: SocialProvider, returnPath = "/browse") {
  if (!isSocialProviderConfigured(provider)) throw new Error(`${provider} authentication is not configured`);
  const { clientId, redirectUri } = config(provider);
  const state = base64url(randomBytes(32));
  const { verifier, challenge } = createPkce();
  states.set(state, { provider, codeVerifier: verifier, createdAt: Date.now(), returnPath: returnPath.startsWith("/") ? returnPath : "/browse" });
  const params = new URLSearchParams({ client_id: clientId!, redirect_uri: redirectUri!, response_type: "code", scope: provider === "google" ? "openid email profile" : "name email", state, code_challenge: challenge, code_challenge_method: "S256" });
  if (provider === "apple") params.set("response_mode", "form_post");
  return provider === "google" ? `https://accounts.google.com/o/oauth2/v2/auth?${params}` : `https://appleid.apple.com/auth/authorize?${params}`;
}

export function consumeOAuthState(state: string, provider: SocialProvider) {
  const entry = states.get(state);
  states.delete(state);
  if (!entry || entry.provider !== provider || Date.now() - entry.createdAt > STATE_TTL) return undefined;
  return entry;
}

async function googleIdentity(code: string, state: OAuthState): Promise<SocialIdentity> {
  const current = config("google");
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: current.clientId!, client_secret: current.clientSecret!, redirect_uri: current.redirectUri!, grant_type: "authorization_code", code_verifier: state.codeVerifier }) });
  if (!response.ok) throw new Error("Google token exchange failed");
  const tokens = await response.json() as { id_token?: string };
  if (!tokens.id_token) throw new Error("Google did not return an identity token");
  const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
  const verified = await jwtVerify(tokens.id_token, keys, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: current.clientId });
  const claims = verified.payload as { sub: string; email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!claims.sub || !claims.email || claims.email_verified !== true) throw new Error("Google account email is not verified");
  return { provider: "google", providerAccountId: claims.sub, email: claims.email.toLowerCase(), emailVerified: true, name: claims.name, photoUrl: claims.picture };
}

async function appleClientSecret() {
  const privateKey = (process.env.APPLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const key = await importPKCS8(privateKey, "ES256");
  return new SignJWT({}).setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID! }).setIssuer(process.env.APPLE_TEAM_ID!).setSubject(process.env.APPLE_CLIENT_ID!).setAudience("https://appleid.apple.com").setIssuedAt().setExpirationTime("180d").sign(key);
}

async function appleIdentity(code: string, state: OAuthState, suppliedUser?: string): Promise<SocialIdentity> {
  const current = config("apple");
  const response = await fetch("https://appleid.apple.com/auth/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: current.clientId!, client_secret: await appleClientSecret(), code, redirect_uri: current.redirectUri!, grant_type: "authorization_code", code_verifier: state.codeVerifier }) });
  if (!response.ok) throw new Error("Apple token exchange failed");
  const tokens = await response.json() as { id_token?: string };
  if (!tokens.id_token) throw new Error("Apple did not return an identity token");
  const keys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
  const verified = await jwtVerify(tokens.id_token, keys, { issuer: "https://appleid.apple.com", audience: current.clientId });
  const claims = verified.payload as { sub: string; email?: string; email_verified?: boolean; is_private_email?: boolean };
  if (!claims.sub || !claims.email) throw new Error("Apple did not return an email address");
  let name: string | undefined;
  if (suppliedUser) {
    try {
      const supplied = JSON.parse(suppliedUser) as { name?: { firstName?: string; lastName?: string } };
      name = [supplied.name?.firstName, supplied.name?.lastName].filter(Boolean).join(" ") || undefined;
    } catch { /* Apple user payload is optional and untrusted; the verified token remains authoritative. */ }
  }
  return { provider: "apple", providerAccountId: claims.sub, email: claims.email.toLowerCase(), emailVerified: claims.email_verified === true, name };
}

export function issueSocialLoginCode(userId: number) {
  const code = createOneTimeToken();
  loginCodes.set(code, { userId, createdAt: Date.now() });
  return code;
}

export function consumeSocialLoginCode(code: string) {
  const entry = loginCodes.get(code);
  loginCodes.delete(code);
  if (!entry || Date.now() - entry.createdAt > CODE_TTL) return undefined;
  return entry;
}

export async function verifySocialCode(code: string, state: OAuthState, suppliedUser?: string) {
  return state.provider === "google" ? googleIdentity(code, state) : appleIdentity(code, state, suppliedUser);
}
