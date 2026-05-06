import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Globe, User, Lock, Shield, Eye, EyeOff, ChevronRight, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CROSS_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663207673551/H429gEWUZrF7HRGamYp8WC/admin-portal-cross-bg-V8d6sXFsGrR9XmxNcHwQGe.webp";

export default function AdminPortal() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const loginMutation = trpc.auth.adminPortalLogin.useMutation({
    onSuccess: (data) => {
      toast.success("Welcome back — redirecting to your dashboard...");
      // Store admin session in localStorage for AdminGuard
      const ttl = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 7 days or 8 hours
      localStorage.setItem("adminSessionToken", data.adminPanel);
      localStorage.setItem("adminSessionExpiry", String(Date.now() + ttl));
      localStorage.setItem("adminPanel", data.adminPanel);
      const panelRoutes: Record<string, string> = {
        finance: "/admin/finance",
        support: "/admin/support",
        systems: "/admin/systems",
        users: "/admin/users",
        announcements: "/admin/announcements",
        roles: "/admin/roles",
        super: "/admin/super",
      };
      navigate(panelRoutes[data.adminPanel] ?? "/admin/super");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Access Denied");
      setIsLoading(false);
    },
  });

  const handlePinChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...pin];
      next[index] = value;
      setPin(next);
      if (value && index < 3) {
        pinRefs[index + 1].current?.focus();
      }
    },
    [pin]
  );

  const handlePinKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !pin[index] && index > 0) {
        pinRefs[index - 1].current?.focus();
      }
    },
    [pin]
  );

  const handleSignIn = () => {
    if (!username.trim()) {
      toast.error("Please enter your admin username.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }
    const pinCode = pin.join("");
    if (pinCode.length < 4) {
      toast.error("Please enter your 4-digit Quick PIN.");
      return;
    }
    setIsLoading(true);
    loginMutation.mutate({ username, password, pin: pinCode });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #0a0520 0%, #1a0a3d 40%, #0d0520 100%)" }}
    >
      {/* Language selector */}
      <div className="flex justify-end p-4 pt-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-white text-sm font-medium">
          <Globe className="w-4 h-4 text-purple-400" />
          <span>English</span>
          <ChevronRight className="w-3 h-3 rotate-90 text-white/60" />
        </button>
      </div>

      {/* Hero section: logo + title + cross bg */}
      <div className="relative flex flex-col items-center px-6 pb-0">
        {/* Heart+cross logo */}
        <div className="mb-4">
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <path
              d="M45 80 C45 80 10 55 10 30 C10 18 20 10 30 10 C37 10 43 14 45 18 C47 14 53 10 60 10 C70 10 80 18 80 30 C80 55 45 80 45 80Z"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="3.5"
            />
            <line x1="45" y1="22" x2="45" y2="58" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />
            <line x1="33" y1="34" x2="57" y2="34" stroke="url(#goldGrad)" strokeWidth="3" strokeLinecap="round" />
            <defs>
              <linearGradient id="goldGrad" x1="10" y1="10" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f5c842" />
                <stop offset="100%" stopColor="#d4a017" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white text-center mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Faithful Hearts
        </h1>
        <p className="text-sm font-bold tracking-[0.25em] text-yellow-400 uppercase mb-2">
          IT Management Portal
        </p>
        {/* Gold divider with diamond */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-400" />
          <div className="w-2 h-2 bg-yellow-400 rotate-45" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-400" />
        </div>
        <p className="text-white/70 text-sm text-center mb-4 leading-relaxed">
          Secure access for authorized<br />administrators only.
        </p>

        {/* Cross background image */}
        <div className="w-full max-w-sm rounded-2xl overflow-hidden mb-6" style={{ height: 200 }}>
          <img
            src={CROSS_BG}
            alt="Cross at sunset"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 40%" }}
          />
        </div>
      </div>

      {/* Admin Access Form Card */}
      <div className="mx-4 mb-6 rounded-2xl border border-purple-500/30 p-6"
        style={{ background: "rgba(30, 15, 60, 0.85)", backdropFilter: "blur(12px)" }}>

        {/* Card header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139, 92, 246, 0.2)", border: "1.5px solid rgba(139, 92, 246, 0.4)" }}>
            <Shield className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg tracking-wide">ADMIN ACCESS</h2>
            <p className="text-white/50 text-xs">Please sign in to access your dashboard</p>
          </div>
        </div>

        {/* Username field */}
        <div className="mb-4 rounded-xl border border-purple-500/30 px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <label className="text-yellow-400 text-xs font-semibold block mb-1">Username</label>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="mb-4 rounded-xl border border-purple-500/30 px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <label className="text-yellow-400 text-xs font-semibold block mb-1">Password</label>
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="flex-1 bg-transparent text-white placeholder-white/30 text-sm outline-none"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick PIN field */}
        <div className="mb-5 rounded-xl border border-purple-500/30 px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <label className="text-yellow-400 text-xs font-semibold block mb-2">Quick PIN</label>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-white/40 flex-shrink-0" />
            <div className="flex gap-3">
              {pin.map((digit, i) => (
                <div
                  key={i}
                  className="w-11 h-11 rounded-lg border border-purple-500/40 flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <input
                    ref={pinRefs[i]}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-full h-full bg-transparent text-white text-center text-lg font-bold outline-none"
                    style={{ caretColor: "transparent" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remember me + Forgot */}
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                rememberMe ? "bg-purple-600 border-purple-600" : "border-white/30 bg-transparent"
              }`}
            >
              {rememberMe && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-white/70 text-sm">Remember me</span>
          </label>
          <button className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors">
            Forgot PIN or Password?
          </button>
        </div>

        {/* Sign In button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 50%, #4c1d95 100%)",
            border: "1px solid rgba(139, 92, 246, 0.4)",
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {/* Footer badges */}
      <div className="flex justify-around px-6 py-4 mb-2">
        {[
          { icon: <Shield className="w-5 h-5 text-yellow-400" />, label: "Secure", sub: "Encrypted Access" },
          { icon: <User className="w-5 h-5 text-yellow-400" />, label: "Reliable", sub: "Role Based Access" },
          { icon: <Crown className="w-5 h-5 text-yellow-400" />, label: "Kingdom Driven", sub: "Purpose Focused" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 text-center">
            {item.icon}
            <span className="text-white text-xs font-semibold">{item.label}</span>
            <span className="text-white/40 text-[10px]">{item.sub}</span>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="text-center pb-8 px-4">
        <p className="text-white/30 text-xs">
          © 2025 Faithful Hearts. All rights reserved.{" "}
          <span className="text-yellow-400/60">♡</span>
        </p>
      </div>
    </div>
  );
}
