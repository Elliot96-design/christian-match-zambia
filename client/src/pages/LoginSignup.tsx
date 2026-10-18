import { useAuth } from "@/_core/hooks/useAuth";
import { setAuthToken } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { readableAuthError } from "@/lib/auth-errors";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginSignup() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const utils = trpc.useUtils();
  const login = trpc.auth.login.useMutation({ onSuccess: async ({ token, user }) => { setAuthToken(token); await utils.auth.me.invalidate(); navigate(user.profileComplete ? "/browse" : "/setup"); } });
  const register = trpc.auth.register.useMutation({ onSuccess: async ({ token }) => { setAuthToken(token); await utils.auth.me.invalidate(); navigate("/setup"); } });
  const socialLogin = trpc.auth.exchangeSocialCode.useMutation({
    onSuccess: async ({ token, user }) => { setAuthToken(token); await utils.auth.me.invalidate(); navigate(user.profileComplete ? "/browse" : "/setup"); },
    onError: (err) => setError(readableAuthError(err, "login")),
  });

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/browse");
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const socialCode = params.get("social_code");
    const socialError = params.get("social_error");
    if (socialError) setError(socialError);
    if (socialCode) socialLogin.mutate({ code: socialCode });
  }, [search]);

  if (loading) {
    return (
      <div className="h-screen hero-gradient flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-white flex flex-col max-w-[480px] mx-auto overflow-hidden"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Back button */}
      <div className="px-5 pt-4 flex-shrink-0">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Logo + brand */}
      <div className="flex flex-col items-center pt-3 pb-1 px-5 flex-shrink-0">
        <div className="w-16 h-16 mb-2 flex items-center justify-center">
          <img src={LOGO_URL} alt="Faithful Hearts" className="w-full h-full rounded-2xl object-cover shadow-lg" />
        </div>
        <h1 className="font-display font-bold text-xl text-primary">Faithful Hearts</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Love. Faith. Purpose.</p>
      </div>

      {/* Tab switcher */}
      <div className="mx-5 mt-4 bg-gray-100 rounded-2xl p-1 flex flex-shrink-0">
        {(["login", "signup"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
              tab === t ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "login" ? "Log In" : "Sign Up"}
          </button>
        ))}
      </div>

      {/* Form area */}
      <div className="px-5 mt-4 space-y-3 flex-shrink-0">
        <div className="text-center mb-1">
          <h2 className="font-display font-bold text-lg text-primary">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground text-xs mt-0.5">
            {tab === "login" ? "Log in to continue your journey" : "Join our faith community today"}
          </p>
        </div>

        {/* Email */}
        {tab === "signup" && (
          <input value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="Full Name" className="w-full rounded-2xl border border-border bg-white px-4 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors" style={{ height: "52px" }} />
        )}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Mail className="w-4.5 h-4.5" />
          </div>
          <input
            type="email" value={email} onChange={(event) => setEmail(event.target.value)}
            placeholder="Email Address"
            className="w-full h-13 rounded-2xl border border-border bg-white pl-11 pr-4 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            style={{ height: "52px" }}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="w-4.5 h-4.5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)}
            className="w-full h-13 rounded-2xl border border-border bg-white pl-11 pr-12 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            style={{ height: "52px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>

        {tab === "login" && (
          <div className="flex justify-end">
            <button onClick={() => navigate("/forgot-password")} className="text-xs text-primary font-medium">Forgot Password?</button>
          </div>
        )}

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

        {/* Primary CTA */}
        <button
          type="button"
          disabled={login.isPending || register.isPending}
          onClick={async () => {
            setError("");
            try {
              const normalizedEmail = email.trim().toLowerCase();
              if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
                setError("Please enter a valid email address.");
                return;
              }
              if (!password) {
                setError("Please enter your password.");
                return;
              }
              if (tab === "signup" && password.length < 8) {
                setError("Password must be at least 8 characters.");
                return;
              }
              if (tab === "signup" && name.trim().length === 1) {
                setError("Please enter your full name.");
                return;
              }
              if (tab === "login") await login.mutateAsync({ email: normalizedEmail, password, captchaToken: captchaToken || undefined });
              else await register.mutateAsync({ email: normalizedEmail, password, name: name.trim() || undefined });
            } catch (err) {
              const message = readableAuthError(err, tab);
              if (tab === "login" && message.toLowerCase().includes("security check")) setCaptchaRequired(true);
              setError(message);
            }
          }}
          className="btn-purple flex items-center justify-center w-full text-sm font-bold"
          style={{ height: "52px", borderRadius: "16px" }}
        >
          {login.isPending || register.isPending ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
        </button>
        {tab === "login" && captchaRequired && turnstileSiteKey && (
          <div className="flex justify-center pt-1">
            <Turnstile siteKey={turnstileSiteKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
          </div>
        )}
        {tab === "login" && captchaRequired && !turnstileSiteKey && (
          <p className="text-xs text-red-600 text-center">Security verification is not configured. Please contact support.</p>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-5 mt-4 flex-shrink-0">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground text-xs">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Social buttons */}
      <div className="px-5 mt-3 space-y-2.5 flex-shrink-0">
        <button
          type="button"
          disabled={socialLogin.isPending}
          onClick={() => { window.location.href = `/api/auth/social/google/start?returnPath=${encodeURIComponent("/browse")}`; }}
          className="flex items-center gap-3 w-full rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground active:bg-gray-50 transition-colors"
          style={{ height: "52px" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {socialLogin.isPending ? "Connecting…" : "Continue with Google"}
        </button>

        <button
          type="button"
          disabled={socialLogin.isPending}
          onClick={() => { window.location.href = `/api/auth/social/apple/start?returnPath=${encodeURIComponent("/browse")}`; }}
          className="flex items-center gap-3 w-full rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground active:bg-gray-50 transition-colors"
          style={{ height: "52px" }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          {socialLogin.isPending ? "Connecting…" : "Continue with Apple"}
        </button>
      </div>

      {/* Bottom switch */}
      <div className="text-center mt-4 px-5 flex-shrink-0">
        {tab === "login" ? (
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button onClick={() => setTab("signup")} className="text-primary font-bold">
              Sign Up
            </button>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button onClick={() => setTab("login")} className="text-primary font-bold">
              Log In
            </button>
          </p>
        )}
      </div>

      {/* Decorative leaf watermark */}
      <div className="absolute bottom-0 right-0 pointer-events-none opacity-[0.05]">
        <svg viewBox="0 0 120 200" width="100" height="160" fill="none">
          <path d="M60 0 C20 40 0 80 10 130 C20 170 50 190 60 200 C70 190 100 170 110 130 C120 80 100 40 60 0Z" fill="oklch(0.28 0.20 290)" />
        </svg>
      </div>
    </div>
  );
}
