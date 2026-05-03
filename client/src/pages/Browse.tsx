import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import {
  Bell, Camera, ChevronRight, Crown, Heart, HelpCircle,
  Lock, LogOut, MapPin, MessageCircle, RefreshCw,
  Settings, Shield, Star, Users, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import PremiumCheckoutModal from "@/components/PremiumCheckoutModal";
import ManagePlanModal from "@/components/ManagePlanModal";
import BottomNav, { NavTab } from "@/components/BottomNav";
import DiscoverTab from "@/pages/DiscoverTab";

const DAILY_VERSES = [
  { text: "Commit to the Lord whatever you do, and he will establish your plans.", ref: "Proverbs 16:3" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast.", ref: "1 Corinthians 13:4" },
  { text: "He who finds a wife finds what is good and receives favour from the Lord.", ref: "Proverbs 18:22" },
];

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Chipata", "Kasama", "Solwezi",
  "Mongu", "Mansa", "Choma", "Mazabuka", "Kafue", "Other",
];

// ─── Inline SVG icon helpers ──────────────────────────────────────────────────
const PersonIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const BookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const HeartHandIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const ShieldIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const GearIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ─── Profile Tab Component ────────────────────────────────────────────────────
function ProfileTab({ user, onLogout, navigate, onTabChange }: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onLogout: () => void;
  navigate: (path: string) => void;
  onTabChange: (tab: NavTab) => void;
}) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const addPhotoRef = useRef<HTMLInputElement>(null);

  const { data: premiumStatus } = trpc.profile.premiumStatus.useQuery();
  const { data: completionData } = trpc.profile.completionScore.useQuery();
  const { data: myPhotos, refetch: refetchPhotos } = trpc.profile.myPhotos.useQuery();

  const uploadMainPhoto = trpc.profile.uploadPhoto.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Profile photo updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const addPhoto = trpc.profile.addPhoto.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const upgradeToPremium = trpc.profile.upgradeToPremium.useMutation({
    onSuccess: () => {
      utils.profile.premiumStatus.invalidate();
      utils.auth.me.invalidate();
      toast.success("Welcome to Premium! 🎉");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showManagePlan, setShowManagePlan] = useState(false);

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      uploadMainPhoto.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      addPhoto.mutate({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const score = completionData?.score ?? 0;
  const isPremium = premiumStatus?.isPremium ?? user.isPremium;
  const showUpgradeNudge = premiumStatus?.showUpgradeNudge ?? false;

  const menuItemClass =
    "flex items-center gap-3 px-4 py-3.5 bg-white active:bg-gray-50 transition-colors cursor-pointer";
  const iconWrapClass =
    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0";

  return (
    <div className="flex-1 overflow-y-auto pb-24" style={{ background: "oklch(0.97 0.01 290)" }}>
      {/* ── Purple header with avatar ─────────────────────────── */}
      <div className="hero-gradient px-5 pt-5 pb-8">
        <div className="flex items-start gap-4">
          {/* Avatar with camera button */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white/20"
              style={{ boxShadow: "0 0 0 2px oklch(0.72 0.16 80)" }}
            >
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PersonIcon className="w-10 h-10 text-white/60" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md"
              aria-label="Change photo"
            >
              <Camera className="w-3.5 h-3.5" style={{ color: "oklch(0.28 0.20 290)" }} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleMainPhotoChange} />
          </div>

          {/* Name / details */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-white text-xl leading-tight truncate">
                {user.name ?? "Your Name"}
              </h2>
              <button
                onClick={() => navigate("/edit-profile")}
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
                aria-label="Edit profile"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3 h-3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <p className="text-white/80 text-sm mt-0.5">
              {user.age ? `${user.age}` : ""}
              {user.age && user.location ? " • " : ""}
              {user.location && (
                <span className="inline-flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </span>
              )}
            </p>
            {user.church && (
              <p className="text-white/70 text-xs mt-0.5 truncate">{user.church}</p>
            )}
            {user.bio && (
              <p className="text-white/80 text-xs mt-2 italic leading-relaxed line-clamp-2">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Premium / Upgrade badge ───────────────────────────── */}
      <div className="px-4 -mt-4">
        {isPremium ? (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "oklch(0.22 0.18 290)", border: "1px solid oklch(0.72 0.16 80 / 0.4)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.72 0.16 80 / 0.2)" }}
            >
              <Crown className="w-5 h-5" style={{ color: "oklch(0.72 0.16 80)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">
                <span className="text-white">Premium </span>
                <span style={{ color: "oklch(0.72 0.16 80)" }}>Member</span>
              </p>
              <p className="text-white/60 text-xs mt-0.5">You're enjoying all premium benefits.</p>
            </div>
            <button
              className="px-4 py-2 rounded-xl text-xs font-bold flex-shrink-0"
              style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              onClick={() => setShowManagePlan(true)}
            >
              Manage Plan
            </button>
          </div>
        ) : showUpgradeNudge ? (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "oklch(0.22 0.18 290)", border: "1px solid oklch(0.72 0.16 80 / 0.3)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.72 0.16 80 / 0.15)" }}
            >
              <Crown className="w-5 h-5" style={{ color: "oklch(0.72 0.16 80)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Upgrade to Premium</p>
              <p className="text-white/60 text-xs mt-0.5">
                You've unlocked a chat. Go Premium to enjoy unlimited connections!
              </p>
            </div>
            <button
              className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-60"
              style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              disabled={upgradeToPremium.isPending}
              onClick={() => setShowPremiumModal(true)}
            >
              Upgrade
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "oklch(0.22 0.18 290)", border: "1px solid oklch(0.35 0.18 290)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.35 0.18 290)" }}
            >
              <Crown className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Go Premium</p>
              <p className="text-white/60 text-xs mt-0.5">Unlock unlimited chats and more features.</p>
            </div>
            <button
              className="px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 disabled:opacity-60"
              style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              disabled={upgradeToPremium.isPending}
              onClick={() => setShowPremiumModal(true)}
            >
              Go Premium
            </button>
          </div>
        )}
      </div>

      {/* ── My Photos ─────────────────────────────────────────── */}
      <div className="mt-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm" style={{ color: "oklch(0.28 0.20 290)" }}>My Photos</p>
          <button
            className="text-xs font-semibold"
            style={{ color: "oklch(0.45 0.18 290)" }}
            onClick={() => addPhotoRef.current?.click()}
          >
            Add More
          </button>
          <input ref={addPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Main photo */}
          {user.photoUrl && (
            <div className="relative flex-shrink-0 w-24 h-28 rounded-xl overflow-hidden">
              <img src={user.photoUrl} alt="Main" className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Main
              </div>
            </div>
          )}
          {/* Extra photos */}
          {myPhotos?.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-24 h-28 rounded-xl overflow-hidden">
              <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {/* Add photo slot */}
          <button
            onClick={() => addPhotoRef.current?.click()}
            className="flex-shrink-0 w-24 h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1"
            style={{ borderColor: "oklch(0.72 0.16 80 / 0.5)", color: "oklch(0.45 0.18 290)" }}
          >
            <span className="text-2xl font-light leading-none">+</span>
            <span className="text-[10px] font-medium">Add Photo</span>
          </button>
        </div>
      </div>

      {/* ── Profile Completion ────────────────────────────────── */}
      <div className="mt-4 mx-4 rounded-2xl bg-white p-4" style={{ border: "1px solid oklch(0.92 0.03 290)" }}>
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-sm" style={{ color: "oklch(0.28 0.20 290)" }}>Profile Completion</p>
          <p className="font-bold text-sm" style={{ color: "oklch(0.45 0.18 290)" }}>{score}%</p>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, background: "oklch(0.45 0.18 290)" }}
          />
        </div>
        <button
          onClick={() => navigate("/edit-profile")}
          className="flex items-center gap-3 w-full"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.94 0.04 290)" }}
          >
            <Star className="w-4 h-4" style={{ color: "oklch(0.45 0.18 290)" }} />
          </div>
          <p className="text-sm text-gray-600 flex-1 text-left">
            {score < 100 ? "Almost there! Complete your profile to get more matches." : "Your profile is complete!"}
          </p>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      </div>

      {/* ── Personal Details ──────────────────────────────────── */}
      <div className="mt-5 px-4">
        <p className="font-bold text-sm mb-2" style={{ color: "oklch(0.28 0.20 290)" }}>Personal Details</p>
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid oklch(0.92 0.03 290)" }}>
          {[
            {
              icon: <PersonIcon className="w-4.5 h-4.5" />,
              label: "Edit Personal Info",
              sub: "Basic info, location, work, education",
              onClick: () => navigate("/edit-profile"),
              // Show red dot if name, age, gender, or location is missing
              incomplete: !user.name || !user.age || !user.gender || !user.location,
            },
            {
              icon: <BookIcon className="w-4.5 h-4.5" />,
              label: "My Faith & Values",
              sub: "Faith, church, and what matters most",
              onClick: () => navigate("/faith-values"),
              // Show red dot if church is missing
              incomplete: !user.church,
            },
            {
              icon: <HeartHandIcon className="w-4.5 h-4.5" />,
              label: "Relationship Preferences",
              sub: "What you're looking for in a partner",
              onClick: () => navigate("/relationship-prefs"),
              incomplete: false,
            },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${menuItemClass} w-full ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className={iconWrapClass} style={{ background: "oklch(0.94 0.04 290)" }}>
                <span style={{ color: "oklch(0.45 0.18 290)" }}>{item.icon}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  {item.incomplete && (
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: "oklch(0.60 0.22 25)" }}
                      title="Incomplete"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Account & Settings ────────────────────────────────── */}
      <div className="mt-5 px-4">
        <p className="font-bold text-sm mb-2" style={{ color: "oklch(0.28 0.20 290)" }}>Account &amp; Settings</p>
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: "1px solid oklch(0.92 0.03 290)" }}>
          {[
            {
              icon: <GearIcon className="w-4.5 h-4.5" />,
              label: "Account Settings",
              sub: "Email, password, notifications",
              color: "oklch(0.45 0.18 290)",
              bg: "oklch(0.94 0.04 290)",
              onClick: () => toast.info("Account settings coming soon"),
            },
            {
              icon: <ShieldIcon className="w-4.5 h-4.5" />,
              label: "Privacy & Safety",
              sub: "Manage privacy, block and report",
              color: "oklch(0.45 0.18 290)",
              bg: "oklch(0.94 0.04 290)",
              onClick: () => toast.info("Privacy settings coming soon"),
            },
            {
              icon: <HelpCircle className="w-4.5 h-4.5" />,
              label: "Help & Support",
              sub: "FAQs, contact support",
              color: "oklch(0.45 0.18 290)",
              bg: "oklch(0.94 0.04 290)",
              onClick: () => toast.info("Help & Support coming soon"),
            },
            ...(user.role === "admin" ? [{
              icon: <Shield className="w-4.5 h-4.5" />,
              label: "Admin Panel",
              sub: "Manage users and payments",
              color: "oklch(0.45 0.18 290)",
              bg: "oklch(0.94 0.04 290)",
              onClick: () => navigate("/admin"),
            }] : []),
          ].map((item, i, arr) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`${menuItemClass} w-full ${i < arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className={iconWrapClass} style={{ background: item.bg }}>
                <span style={{ color: item.color }}>{item.icon}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}

          {/* Log Out — red accent */}
          <button
            onClick={onLogout}
            className={`${menuItemClass} w-full border-t border-gray-100`}
          >
            <div className={iconWrapClass} style={{ background: "oklch(0.97 0.02 25)" }}>
              <LogOut className="w-4.5 h-4.5" style={{ color: "oklch(0.55 0.20 25)" }} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold" style={{ color: "oklch(0.55 0.20 25)" }}>Log Out</p>
              <p className="text-xs text-gray-400 mt-0.5">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>

      <div className="h-6" />

      {/* Premium Checkout Modal */}
      {showPremiumModal && (
        <PremiumCheckoutModal
          onClose={() => setShowPremiumModal(false)}
          onSuccess={() => {
            setShowPremiumModal(false);
            utils.profile.premiumStatus.invalidate();
            utils.auth.me.invalidate();
            toast.success("Welcome to Premium! 🎉");
          }}
        />
      )}

      {/* Manage Plan Modal */}
      {showManagePlan && (
        <ManagePlanModal
          onClose={() => setShowManagePlan(false)}
          onCancelled={() => {
            utils.profile.premiumStatus.invalidate();
            utils.auth.me.invalidate();
          }}
        />
      )}
    </div>
  );
}

// ─── Chat Tab Component ───────────────────────────────────────────────────────────────
function ChatTab({ onBrowse, navigate }: { onBrowse: () => void; navigate: (path: string) => void }) {
  const { data: chats, isLoading } = trpc.chat.myUnlocked.useQuery();

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-2.5 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-24">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-bold text-xl text-foreground">No Chats Yet</h3>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          Browse members and pay K10 to unlock a private conversation with someone you like.
        </p>
        <button onClick={onBrowse} className="btn-purple mt-6 px-8 py-3 text-sm">
          Browse Members
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="hero-gradient px-5 pt-4 pb-4 flex-shrink-0">
        <p className="text-white font-bold text-base">Your Conversations</p>
        <p className="text-white/70 text-xs">{chats.length} unlocked chat{chats.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-4 pt-3 space-y-2">
        {chats.map((chat) => (
          <button
            key={chat.targetId}
            onClick={() => navigate(`/chat/${chat.targetId}`)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white text-left transition-all active:scale-[0.98]"
            style={{ border: "1px solid oklch(0.92 0.03 290)" }}
          >
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: "oklch(0.94 0.04 290)" }}
            >
              {chat.targetPhotoUrl ? (
                <img src={chat.targetPhotoUrl} alt={chat.targetName ?? ""} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <PersonIcon className="w-6 h-6 text-purple-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">
                {chat.targetName ?? "Member"}{chat.targetAge ? `, ${chat.targetAge}` : ""}
              </p>
              {chat.targetChurch && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{chat.targetChurch}</p>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs" style={{ color: "oklch(0.55 0.18 290)" }}>Tap to open chat</p>
                <span className="text-gray-300 text-xs">·</span>
                <p className="text-xs text-gray-400">
                  {new Date(chat.unlockedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Unlocked badge */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.94 0.04 290)" }}
            >
              <MessageCircle className="w-4 h-4" style={{ color: "oklch(0.45 0.18 290)" }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Browse Page ─────────────────────────────────────────────────────────────────
export default function Browse() {  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [filterGender, setFilterGender] = useState<"male" | "female" | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [offset, setOffset] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  // Derive active tab from URL query param
  const tabParam = new URLSearchParams(searchString).get("tab") as NavTab | null;
  const validTabs: NavTab[] = ["home", "swipe", "chat", "profile", "chatroom", "notifications"];
  const activeTab: NavTab = tabParam && validTabs.includes(tabParam) ? tabParam : "home";
  const setActiveTab = (tab: NavTab) => {
    if (tab === "chatroom") {
      navigate("/chatroom");
    } else {
      navigate(tab === "home" ? "/browse" : `/browse?tab=${tab}`);
    }
  };

  const verseIndex = new Date().getDate() % DAILY_VERSES.length;
  const verse = DAILY_VERSES[verseIndex]!;

  const { data: browseUsers, isLoading, refetch, error: browseError } = trpc.browse.list.useQuery(
    { gender: filterGender, location: filterLocation, offset },
    { enabled: !!isAuthenticated && !loading && !isBanned }
  );

  // Detect banned user from browse query error
  useEffect(() => {
    if (browseError?.data?.code === "FORBIDDEN") {
      setIsBanned(true);
    }
  }, [browseError]);

  // Auth redirects via useEffect (not render-time)
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/");
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!loading && isAuthenticated && user && !user.profileComplete) navigate("/setup");
  }, [loading, isAuthenticated, user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-screen hero-gradient flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;
  if (!user.profileComplete) return null;

  // Banned user screen
  if (isBanned) {
    return (
      <div className="h-screen hero-gradient flex flex-col items-center justify-center px-6 text-center max-w-[480px] mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-display font-bold text-white text-xl mb-2">Account Suspended</h2>
        <p className="text-white/70 text-sm max-w-xs mb-6">
          Your account has been suspended. Please contact support if you believe this is a mistake.
        </p>
        <button
          onClick={handleLogout}
          className="btn-gold px-8 py-3 text-sm font-bold"
        >
          Sign Out
        </button>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Friend";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const currentCard = browseUsers && browseUsers.length > 0 ? browseUsers[cardIndex % browseUsers.length] : null;

  const handleSwipeNext = () => setCardIndex((i) => i + 1);
  const handleSwipeLike = () => { toast.success("Liked! ❤️"); setCardIndex((i) => i + 1); };
  const handleUnlockChat = (userId: number) => { setSelectedUserId(userId); setShowPayment(true); };

  // ── Tab content renderer ──────────────────────────────────
  const renderContent = () => {
    // ── PROFILE tab ──────────────────────────────────────────
    if (activeTab === "profile") {
      if (!user) return null;
      return <ProfileTab user={user} onLogout={handleLogout} navigate={navigate} onTabChange={setActiveTab} />;
    }

    // ── SWIPE / DISCOVER tab ───────────────────────────────────────────────
    if (activeTab === "swipe") {
      return <DiscoverTab />;
    }

    // ── CHAT tab ────────────────────────────────────────────────────
    if (activeTab === "chat") {
      return <ChatTab onBrowse={() => setActiveTab("swipe")} navigate={navigate} />;
    }

    // ── NOTIFICATIONS tab ──────────────────────────────────────────────────
    if (activeTab === "notifications") {
      return (
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Notifications</h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: "❤️", title: "Someone liked your profile", time: "2 min ago", desc: "A new member liked your profile. Upgrade to see who!" },
              { icon: "💬", title: "New message request", time: "1 hr ago", desc: "You have a new chat unlock request waiting." },
              { icon: "👑", title: "Premium reminder", time: "3 hrs ago", desc: "Upgrade to Premium for K50 first month to unlock unlimited features." },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-foreground">{n.title}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── HOME tab (default) ────────────────────────────────────
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Greeting strip */}
        <div className="hero-gradient px-5 pt-4 pb-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-base">
                {greeting}, {firstName}! ✨
              </p>
              <p className="text-white/70 text-xs">Let your faith guide your heart.</p>
            </div>
            <button className="btn-gold flex items-center gap-1.5 px-3 py-2 text-xs">
              <Crown className="w-3 h-3" />
              Go Premium
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-24 space-y-3">
          {/* Profile swipe card */}
          {isLoading ? (
            <div className="profile-card bg-gray-200 h-64 animate-pulse" />
          ) : currentCard ? (
            <div className="profile-card relative overflow-hidden">
              <div className="relative h-64 bg-gray-100">
                {currentCard.photoUrl ? (
                  <img src={currentCard.photoUrl} alt={currentCard.name ?? "Member"} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <PersonIcon className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">New</div>
                <button onClick={handleSwipeLike} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Heart className="w-4.5 h-4.5 text-primary" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-6 pb-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-bold text-lg">{currentCard.name ?? "Member"}{currentCard.age ? `, ${currentCard.age}` : ""}</p>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400 flex-shrink-0">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {currentCard.church && <p className="text-white/80 text-xs">{currentCard.church}</p>}
                  {currentCard.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-white/60" />
                      <span className="text-white/70 text-xs">{currentCard.location}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 py-3 bg-white">
                <button onClick={handleSwipeNext} className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center shadow-sm">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
                <button onClick={handleSwipeLike} className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ background: "oklch(0.28 0.20 290)" }}>
                  <Heart className="w-5 h-5 text-white fill-white" />
                </button>
              </div>
              {/* Unlock banner */}
              <button
                onClick={() => handleUnlockChat(currentCard.id)}
                className="w-full flex items-center justify-center gap-2 py-3 text-white text-sm font-semibold"
                style={{ background: "oklch(0.28 0.20 290)" }}
              >
                <Lock className="w-4 h-4" />
                Pay <span style={{ color: "oklch(0.72 0.16 80)" }} className="font-bold mx-0.5">K10</span> to permanently unlock chat with {currentCard.name?.split(" ")[0] ?? "them"}
              </button>
            </div>
          ) : (
            <div className="profile-card bg-white flex flex-col items-center justify-center py-12 text-center px-6">
              <Users className="w-10 h-10 text-gray-300 mb-3" />
              <p className="font-semibold text-gray-700">No members found</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to join!</p>
              <button onClick={() => refetch()} className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          )}

          {/* Premium upsell */}
          <div className="rounded-2xl p-4 flex items-center gap-3 bg-white" style={{ border: "1px solid oklch(0.92 0.03 290)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.28 0.20 290)" }}>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Premium Members Unlock More</p>
              <p className="text-gray-400 text-xs mt-0.5">K50 first month · K100 after. Unlimited features.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
          </div>

          {/* Daily Verse */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-gray-800 text-sm">Community Spotlight</p>
              <button className="text-primary text-xs font-medium">View All</button>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.55 0.10 60) 0%, oklch(0.45 0.12 55) 100%)" }}>
              <div className="p-4 flex gap-3">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">Daily Verse</p>
                  <p className="text-white/90 text-sm italic leading-relaxed">"{verse.text}"</p>
                  <p className="text-white/70 text-xs mt-1.5">— {verse.ref}</p>
                </div>
                <div className="w-12 flex items-center justify-center opacity-25">
                  <svg viewBox="0 0 40 60" fill="none" className="w-full">
                    <line x1="20" y1="2" x2="20" y2="58" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <line x1="8" y1="16" x2="32" y2="16" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-background flex flex-col max-w-[480px] mx-auto overflow-hidden">
      {/* Top header */}
      <header className="hero-gradient px-4 pt-3 pb-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => setActiveTab("home")} className="w-9 h-9 flex items-center justify-center rounded-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-display font-bold text-white text-base">Faithful Hearts</span>
        </div>
        <div className="relative">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10">
            <Bell className="w-5 h-5 text-white" />
          </button>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-primary text-[9px] font-bold rounded-full flex items-center justify-center">3</span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom nav */}
      <BottomNav active={activeTab} onTabChange={setActiveTab} />

      {/* Payment modal */}
      {showPayment && selectedUserId && (
        <PaymentModal
          targetId={selectedUserId}
          targetName={browseUsers?.find((u) => u.id === selectedUserId)?.name ?? "this member"}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); navigate(`/chat/${selectedUserId}`); }}
        />
      )}
    </div>
  );
}
