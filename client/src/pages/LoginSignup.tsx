import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LOGO_URL } from "@/components/AppHeader";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginSignup() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/browse");
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* Back button */}
      <div className="px-5 pt-5">
        <button
          onClick={() => navigate("/")}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Logo + brand */}
      <div className="flex flex-col items-center pt-6 pb-2 px-5">
        {/* Heart-cross logo SVG */}
        <div className="w-16 h-16 mb-3 flex items-center justify-center">
          <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
            {/* Heart shape */}
            <path
              d="M40 68 C40 68 8 48 8 26 C8 16 16 8 26 8 C32 8 38 12 40 16 C42 12 48 8 54 8 C64 8 72 16 72 26 C72 48 40 68 40 68Z"
              fill="none"
              stroke="oklch(0.28 0.20 290)"
              strokeWidth="3"
            />
            {/* Cross */}
            <line x1="40" y1="14" x2="40" y2="44" stroke="oklch(0.72 0.16 80)" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="28" y1="24" x2="52" y2="24" stroke="oklch(0.72 0.16 80)" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-primary">Faithful Hearts</h1>
        <p className="text-muted-foreground text-sm mt-1">Love. Faith. Purpose.</p>
      </div>

      {/* Tab switcher */}
      <div className="mx-5 mt-6 bg-gray-100 rounded-2xl p-1 flex">
        <button
          onClick={() => setTab("login")}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
            tab === "login"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
            tab === "signup"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Form area */}
      <div className="px-5 mt-6 space-y-4">
        <div className="text-center mb-2">
          <h2 className="font-display font-bold text-xl text-primary">
            {tab === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {tab === "login"
              ? "Log in to continue your journey"
              : "Join our faith community today"}
          </p>
        </div>

        {/* Email field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Mail className="w-5 h-5" />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            className="w-full h-14 rounded-2xl border border-border bg-white pl-12 pr-4 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Password field */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-14 rounded-2xl border border-border bg-white pl-12 pr-12 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {tab === "login" && (
          <div className="flex justify-end">
            <button className="text-sm text-primary font-medium">Forgot Password?</button>
          </div>
        )}

        {/* Primary CTA — uses Manus OAuth */}
        <a
          href={getLoginUrl()}
          className="btn-purple flex items-center justify-center w-full h-14 text-base mt-2"
        >
          {tab === "login" ? "Log In" : "Create Account"}
        </a>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-5 mt-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-muted-foreground text-xs">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Social buttons */}
      <div className="px-5 mt-4 space-y-3">
        <a
          href={getLoginUrl()}
          className="flex items-center gap-3 w-full h-14 rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground active:bg-gray-50 transition-colors"
        >
          {/* Google G icon */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        <a
          href={getLoginUrl()}
          className="flex items-center gap-3 w-full h-14 rounded-2xl border border-border bg-white px-5 text-sm font-medium text-foreground active:bg-gray-50 transition-colors"
        >
          {/* Apple icon */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Continue with Apple
        </a>
      </div>

      {/* Bottom switch */}
      <div className="text-center mt-6 pb-10 px-5">
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

      {/* Decorative leaf watermark bottom-right */}
      <div className="fixed bottom-0 right-0 pointer-events-none opacity-[0.06]">
        <svg viewBox="0 0 120 200" width="120" height="200" fill="none">
          <path d="M60 0 C20 40 0 80 10 130 C20 170 50 190 60 200 C70 190 100 170 110 130 C120 80 100 40 60 0Z" fill="oklch(0.28 0.20 290)" />
        </svg>
      </div>
    </div>
  );
}
