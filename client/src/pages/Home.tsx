import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { LOGO_URL } from "@/components/AppHeader";

// How It Works steps matching the reference design
const HOW_IT_WORKS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
    title: "Create Your Profile",
    desc: "Share your story, your faith, and what you're looking for.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Discover & Connect",
    desc: "Find like-minded Christians who share your values.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Unlock & Chat",
    desc: "Become a premium member to unlock chats and build deeper connections.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Grow Together",
    desc: "Build a Christ-centered relationship that honours God.",
  },
];

export default function Home() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user && !user.profileComplete) {
        navigate("/setup");
      } else {
        navigate("/browse");
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient overflow-y-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <div className="flex items-center gap-2.5">
          <img src={LOGO_URL} alt="Faithful Hearts" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
          <div>
            <p className="font-display font-bold text-white text-base leading-tight">Faithful</p>
            <p className="font-display font-bold text-white text-base leading-tight">Hearts</p>
          </div>
        </div>
        <a
          href={getLoginUrl()}
          className="badge-premium flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          Premium
        </a>
      </div>

      {/* Tagline */}
      <div className="px-5 pt-2 pb-1">
        <p className="text-gold font-semibold text-sm tracking-wide">Love. Faith. Purpose.</p>
      </div>

      {/* Hero headline */}
      <div className="px-5 pt-3 pb-4">
        <h1 className="font-display text-white text-4xl font-bold leading-tight">
          Where Faith<br />
          Leads to <span className="text-gold">Love</span>
        </h1>
        <p className="text-white/70 text-sm mt-3 leading-relaxed max-w-xs">
          A premium Christian dating community for believers who desire a God-centred relationship.
        </p>
      </div>

      {/* Couple image placeholder — decorative arc */}
      <div className="relative mx-5 rounded-3xl overflow-hidden bg-gradient-to-b from-purple-900/40 to-purple-950/80 h-52 flex items-end justify-center mb-2">
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
            <ellipse cx="100" cy="140" rx="90" ry="60" fill="white" opacity="0.15" />
            <circle cx="75" cy="80" r="38" fill="white" opacity="0.08" />
            <circle cx="125" cy="80" r="38" fill="white" opacity="0.08" />
          </svg>
        </div>
        <div className="relative z-10 text-center pb-5">
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gold">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ))}
          </div>
          <p className="text-white/80 text-xs">"God brought us together through this app"</p>
          <p className="text-gold text-xs mt-0.5">— James & Grace, Lusaka</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="mx-5 mt-5 rounded-3xl p-5" style={{ background: "oklch(0.26 0.18 290 / 0.90)", border: "1px solid oklch(0.40 0.12 290 / 0.35)" }}>
        <h2 className="text-gold font-display font-bold text-lg mb-4">How It Works</h2>
        <div className="space-y-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: "oklch(0.35 0.18 290)" }}>
                {step.icon}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{step.title}</p>
                <p className="text-white/60 text-xs mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 mt-6 pb-4">
        <button
          onClick={() => navigate("/login")}
          className="btn-gold flex items-center justify-center gap-2 w-full h-14 text-base"
        >
          Get Started
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Footer tagline */}
      <p className="text-center text-white/40 text-xs pb-8">
        Premium community. Meaningful connections. Eternal purpose.
      </p>
    </div>
  );
}
