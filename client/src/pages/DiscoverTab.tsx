import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Crown, MapPin, Briefcase, Heart, ChevronRight, X, RefreshCw, Lock, Check } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";
import PremiumCheckoutModal from "@/components/PremiumCheckoutModal";

type FilterChip = "all" | "online" | "new" | "nearby";

const FILTER_CHIPS: { id: FilterChip; label: string; icon?: React.ReactNode }[] = [
  { id: "all", label: "All", icon: <span className="inline-block w-4 h-4 mr-1 align-middle">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  </span> },
  { id: "online", label: "Online Now" },
  { id: "new", label: "New Members" },
  { id: "nearby", label: "Nearby" },
];

const PREMIUM_FEATURES = [
  { icon: <Heart className="w-3.5 h-3.5" />, label: "Unlimited likes" },
  { icon: <span className="text-[11px] font-bold">👁</span>, label: "See who likes you" },
  { icon: <span className="text-[11px]">📞</span>, label: "Voice & Video calls" },
  { icon: <span className="text-[11px]">🙏</span>, label: "Prayer sessions" },
  { icon: <span className="text-[11px]">⚙️</span>, label: "Advanced filters" },
];

const PersonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export default function DiscoverTab() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [filter, setFilter] = useState<FilterChip>("all");
  const [cardIndex, setCardIndex] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<Set<number>>(new Set());

  const { data: profiles, isLoading, refetch } = trpc.browse.swipeList.useQuery(
    { filter, offset: 0 },
    { refetchInterval: false }
  );

  const currentProfile = profiles && profiles.length > 0
    ? profiles[cardIndex % profiles.length]
    : null;

  const totalPhotos = 1; // single photo per profile for now
  const photoIndex = 1;

  const handleDislike = useCallback(() => {
    setCardIndex((i) => i + 1);
    toast("Skipped", { icon: "✕" });
  }, []);

  const handleRefresh = useCallback(() => {
    setCardIndex(0);
    refetch();
    toast("Refreshed!", { icon: "🔄" });
  }, [refetch]);

  const handleLike = useCallback(() => {
    if (!currentProfile) return;
    setSavedProfiles((prev) => new Set(prev).add(currentProfile.id));
    setCardIndex((i) => i + 1);
    toast.success("Liked! ❤️");
  }, [currentProfile]);

  const handleSaveHeart = useCallback(() => {
    if (!currentProfile) return;
    setSavedProfiles((prev) => {
      const next = new Set(prev);
      if (next.has(currentProfile.id)) {
        next.delete(currentProfile.id);
        toast("Removed from saved");
      } else {
        next.add(currentProfile.id);
        toast.success("Saved to favourites ❤️");
      }
      return next;
    });
  }, [currentProfile]);

  const handleUnlockChat = useCallback(() => {
    if (!currentProfile) return;
    setSelectedUserId(currentProfile.id);
    setShowPayment(true);
  }, [currentProfile]);

  const isSaved = currentProfile ? savedProfiles.has(currentProfile.id) : false;

  // ── Colours (dark theme matching reference) ───────────────────────────────
  const bg = "#0d0520";          // near-black purple
  const cardBg = "#1a0e35";      // card dark purple
  const chipActiveBg = "#3d1f7a";
  const chipBorderActive = "#7c3aed";
  const gold = "#f5a623";
  const goldText = "#f5a623";
  const purplePrimary = "#6d28d9";

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto pb-24"
      style={{ background: bg }}
    >
      {/* ── Header: Discover + Premium badge ───────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl leading-tight">Discover</h1>
          <p className="text-white/50 text-xs mt-0.5">Find godly connections that lead to purpose and love.</p>
        </div>
        <button
          onClick={() => setShowPremiumModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/20 flex-shrink-0"
          style={{ background: "rgba(109,40,217,0.35)" }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.2)" }}>
            <Crown className="w-4 h-4" style={{ color: gold }} />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-xs leading-none">Premium</p>
            <p className="text-white/50 text-[10px] leading-none mt-0.5">Upgrade &amp; enjoy all features</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/40 ml-0.5" />
        </button>
      </div>

      {/* ── Unlock full experience banner ──────────────────────────────────── */}
      {!user?.isPremium && (
        <div
          className="mx-4 mb-3 rounded-2xl p-4 flex-shrink-0"
          style={{ background: "rgba(109,40,217,0.25)", border: "1px solid rgba(109,40,217,0.4)" }}
        >
          <div className="flex items-start gap-3 mb-3">
            {/* Shield + cross icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(109,40,217,0.4)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(109,40,217,0.6)" stroke={gold} strokeWidth="1.5" />
                <line x1="12" y1="8" x2="12" y2="16" stroke={gold} strokeWidth="2" strokeLinecap="round" />
                <line x1="8.5" y1="12" x2="15.5" y2="12" stroke={gold} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-white font-bold text-sm">Unlock the full experience</p>
                <Crown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: gold }} />
              </div>
              <p className="text-white/60 text-xs mt-0.5 leading-relaxed">
                Go Premium and enjoy all features across the app.
              </p>
            </div>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="px-3 py-2 rounded-xl font-bold text-xs flex-shrink-0"
              style={{ background: gold, color: "#1a0e35" }}
            >
              Upgrade Now
            </button>
          </div>
          {/* Feature icons row */}
          <div className="flex items-center gap-3 flex-wrap">
            {PREMIUM_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(109,40,217,0.5)", border: "1px solid rgba(109,40,217,0.7)" }}
                >
                  <span className="text-white/80" style={{ fontSize: 10 }}>{f.icon}</span>
                </div>
                <span className="text-white/60 text-[10px] leading-tight">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div className="px-4 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_CHIPS.map((chip) => {
            const isActive = filter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => { setFilter(chip.id); setCardIndex(0); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
                style={
                  isActive
                    ? { background: chipActiveBg, border: `1.5px solid ${chipBorderActive}`, color: "white" }
                    : { background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.55)" }
                }
              >
                {chip.id === "online" && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isActive ? "#22c55e" : "rgba(34,197,94,0.5)" }}
                  />
                )}
                {chip.id === "new" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                )}
                {chip.id === "nearby" && (
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                )}
                {chip.id === "all" && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────── */}
      <div className="px-4 flex-shrink-0">
        {isLoading ? (
          <div className="rounded-3xl overflow-hidden animate-pulse" style={{ background: cardBg, height: 480 }} />
        ) : !currentProfile ? (
          <div
            className="rounded-3xl flex flex-col items-center justify-center py-16 text-center"
            style={{ background: cardBg, border: "1px solid rgba(109,40,217,0.3)" }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(109,40,217,0.3)" }}>
              <PersonIcon className="w-8 h-8 text-white/40" />
            </div>
            <p className="text-white font-semibold text-base">No members found</p>
            <p className="text-white/40 text-sm mt-1">Be the first to join!</p>
            <button
              onClick={() => { setCardIndex(0); refetch(); }}
              className="mt-4 flex items-center gap-2 text-sm font-medium"
              style={{ color: goldText }}
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden relative" style={{ border: "1px solid rgba(109,40,217,0.4)" }}>
            {/* Photo */}
            <div className="relative" style={{ aspectRatio: "3/4", maxHeight: 480 }}>
              {currentProfile.photoUrl ? (
                <img
                  src={currentProfile.photoUrl}
                  alt={currentProfile.name ?? "Member"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: cardBg }}>
                  <PersonIcon className="w-20 h-20 text-white/20" />
                </div>
              )}

              {/* Top-left: Premium Member badge */}
              {currentProfile.isPremium && (
                <div
                  className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(109,40,217,0.85)", backdropFilter: "blur(8px)" }}
                >
                  <Crown className="w-3.5 h-3.5" style={{ color: gold }} />
                  <span className="text-white text-xs font-bold">Premium Member</span>
                </div>
              )}

              {/* Top-right: photo counter + K20 badge */}
              <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "white" }}
                >
                  1 / 1
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  K20
                </div>
              </div>

              {/* Bottom-right: heart save button */}
              <button
                onClick={handleSaveHeart}
                className="absolute bottom-20 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isSaved ? "rgba(109,40,217,0.9)" : "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  border: "1.5px solid rgba(255,255,255,0.25)",
                }}
                aria-label="Save profile"
              >
                <Heart
                  className="w-5 h-5"
                  style={{ color: isSaved ? "white" : "rgba(255,255,255,0.8)", fill: isSaved ? "white" : "none" }}
                />
              </button>

              {/* Bottom gradient overlay with profile info */}
              <div
                className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12"
                style={{ background: "linear-gradient(to top, rgba(10,4,30,0.95) 0%, rgba(10,4,30,0.6) 60%, transparent 100%)" }}
              >
                {/* Name + verified */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-xl leading-tight">
                    {currentProfile.name ?? "Member"}{currentProfile.age ? `, ${currentProfile.age}` : ""}
                  </span>
                  <svg viewBox="0 0 24 24" fill="#3b82f6" className="w-5 h-5 flex-shrink-0">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                {/* Location */}
                {currentProfile.location && (
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{currentProfile.location}</span>
                  </div>
                )}

                {/* Faith */}
                {currentProfile.faithLevel && (
                  <div className="flex items-center gap-1 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0">
                      <line x1="12" y1="3" x2="12" y2="21" strokeLinecap="round" />
                      <line x1="7" y1="8" x2="17" y2="8" strokeLinecap="round" />
                    </svg>
                    <span className="text-white/70 text-sm">
                      {currentProfile.faithLevel === "deeply_rooted"
                        ? "Faith is the center of my life"
                        : currentProfile.faithLevel === "committed"
                        ? "Committed to my faith"
                        : "Growing in faith"}
                    </span>
                  </div>
                )}

                {/* Occupation */}
                {(currentProfile as { occupation?: string | null }).occupation && (
                  <div className="flex items-center gap-1 mb-1">
                    <Briefcase className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                    <span className="text-white/70 text-sm">{(currentProfile as { occupation?: string | null }).occupation}</span>
                  </div>
                )}

                {/* Looking for */}
                {currentProfile.lookingFor && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                    <span className="text-white/70 text-sm">
                      {currentProfile.lookingFor === "marriage"
                        ? "Looking for a godly, purpose-driven relationship"
                        : currentProfile.lookingFor === "friendship"
                        ? "Looking for meaningful friendship"
                        : currentProfile.lookingFor === "dating"
                        ? "Open to dating with intention"
                        : "Exploring connections"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Unlock chat K20 CTA bar */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ background: "rgba(20,10,45,0.97)", borderTop: "1px solid rgba(109,40,217,0.3)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(109,40,217,0.4)", border: "1.5px solid rgba(109,40,217,0.6)" }}
              >
                <Lock className="w-4.5 h-4.5 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  Want to chat with {currentProfile.name?.split(" ")[0] ?? "them"}?
                </p>
                <p className="text-xs mt-0.5" style={{ color: goldText }}>
                  Pay K20 once off to unlock chat.
                </p>
              </div>
              <button
                onClick={handleUnlockChat}
                className="px-4 py-2.5 rounded-xl font-bold text-sm flex-shrink-0"
                style={{ background: gold, color: "#1a0e35" }}
              >
                Unlock Chat<br />
                <span className="text-xs font-extrabold">K20</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons: Dislike / Refresh / Like ───────────────────────── */}
      <div className="flex items-center justify-center gap-6 py-5 flex-shrink-0">
        {/* Dislike (X) */}
        <button
          onClick={handleDislike}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)" }}
          aria-label="Dislike"
        >
          <X className="w-7 h-7 text-white/70" />
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.15)" }}
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5" style={{ color: purplePrimary }} />
        </button>

        {/* Like (Heart) — large purple */}
        <button
          onClick={handleLike}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: purplePrimary, boxShadow: `0 4px 20px rgba(109,40,217,0.5)` }}
          aria-label="Like"
        >
          <Heart className="w-7 h-7 text-white fill-white" />
        </button>
      </div>

      {/* ── Premium upgrade card at bottom ─────────────────────────────────── */}
      {!user?.isPremium && (
        <div
          className="mx-4 mb-4 rounded-2xl p-4 flex-shrink-0"
          style={{ background: "rgba(20,10,45,0.95)", border: "1px solid rgba(109,40,217,0.3)" }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}
            >
              <Crown className="w-6 h-6" style={{ color: gold }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 text-xs leading-relaxed">
                Upgrade to premium for only{" "}
                <span style={{ color: gold }} className="font-bold">K50</span> first month,{" "}
                <span style={{ color: gold }} className="font-bold">K100</span> after and enjoy{" "}
                <span style={{ color: gold }} className="font-bold">unlimited</span> features plus have access to the chatroom.
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <button
                onClick={() => setShowPremiumModal(true)}
                className="px-3 py-2 rounded-xl font-bold text-xs mb-1"
                style={{ background: gold, color: "#1a0e35" }}
              >
                Upgrade Now
              </button>
              <p className="text-white/50 text-[10px] leading-tight">K50 first month</p>
              <p className="text-white/50 text-[10px] leading-tight">K100 after</p>
            </div>
          </div>

          {/* Feature checklist */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {[
              "Unlimited likes",
              "Voice & video calls",
              "See who likes you",
              "Join prayer sessions",
              "Advanced filters & more",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 flex-shrink-0" style={{ color: gold }} />
                <span className="text-white/55 text-[11px]">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && selectedUserId && (
        <PaymentModal
          targetId={selectedUserId}
          targetName={profiles?.find((u) => u.id === selectedUserId)?.name ?? "this member"}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            utils.chat.checkUnlock.invalidate({ targetId: selectedUserId });
            navigate(`/chat/${selectedUserId}`);
          }}
        />
      )}

      {/* Premium checkout modal */}
      {showPremiumModal && (
        <PremiumCheckoutModal
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => {
            setShowPremiumModal(false);
            utils.auth.me.invalidate();
            utils.profile.premiumStatus.invalidate();
            toast.success("Welcome to Premium! 🎉");
          }}
        />
      )}
    </div>
  );
}
