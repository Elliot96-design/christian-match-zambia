import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Bell, ChevronRight, Crown, Heart, Lock, MapPin,
  Share2, Briefcase, Cross, Megaphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import PremiumCheckoutModal from "@/components/PremiumCheckoutModal";
import { LOGO_URL } from "@/components/AppHeader";

const BIBLE_VERSE_BG = "/faithful-hearts-bible-bg.svg";

const DAILY_VERSES = [
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight.",
    ref: "Proverbs 3:5-6 (NIV)",
  },
  {
    text: "Commit to the Lord whatever you do, and he will establish your plans.",
    ref: "Proverbs 16:3 (NIV)",
  },
  {
    text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    ref: "1 Corinthians 13:4 (NIV)",
  },
  {
    text: "He who finds a wife finds what is good and receives favour from the Lord.",
    ref: "Proverbs 18:22 (NIV)",
  },
  {
    text: "Two are better than one, because they have a good return for their labor.",
    ref: "Ecclesiastes 4:9 (NIV)",
  },
  {
    text: "Delight yourself in the Lord, and he will give you the desires of your heart.",
    ref: "Psalm 37:4 (NIV)",
  },
  {
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.",
    ref: "Jeremiah 29:11 (NIV)",
  },
];

// ─── Profile Card for Suggested For You ──────────────────────────────────────
function SuggestedProfileCard({
  profile,
  onUnlock,
  onLike,
  onUpgradePremium,
  isPremiumUser,
}: {
  profile: {
    id: number;
    name: string | null;
    age: number | null;
    location: string | null;
    photoUrl: string | null;
    isPremium: boolean;
    isOnline: boolean;
    occupation: string | null;
    denomination: string | null;
  };
  onUnlock: (id: number) => void;
  onLike: (id: number) => void;
  onUpgradePremium: () => void;
  isPremiumUser: boolean;
}) {
  const firstName = profile.name?.split(" ")[0] ?? "Member";
  const lastName = profile.name?.split(" ")[1]?.[0] ? `${profile.name.split(" ")[1][0]}.` : "";
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: 160,
        background: "oklch(0.97 0.01 290)",
        border: "1px solid oklch(0.90 0.04 290)",
        boxShadow: "0 4px 16px oklch(0 0 0 / 0.10)",
      }}
    >
      {/* Photo */}
      <div className="relative" style={{ height: 180 }}>
        {profile.photoUrl ? (
          <img
            src={profile.photoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "oklch(0.90 0.06 290)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12" style={{ color: "oklch(0.55 0.12 290)" }}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}

        {/* Premium Member badge */}
        {profile.isPremium && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{ background: "oklch(0.22 0.18 290 / 0.92)", color: "oklch(0.72 0.16 80)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3h10v2H7v-2z" />
            </svg>
            Premium member
          </div>
        )}

        {/* Heart save button */}
        <button
          onClick={() => onLike(profile.id)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "oklch(1 0 0 / 0.85)" }}
          aria-label="Like"
        >
          <Heart className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.18 290)" }} />
        </button>

        {/* Gradient overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)" }}
        >
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm leading-tight">{displayName}</span>
            {/* Verified check */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.60 0.20 250)" }}>
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: profile.isOnline ? "oklch(0.65 0.20 145)" : "oklch(0.70 0.05 290)" }}
            />
            <span className="text-white/80 text-[10px]">
              {profile.age ? `${profile.age}, ` : ""}{profile.location ?? "Zambia"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-2 pt-1.5 pb-2">
        {/* K20 badge or premium upgrade */}
        {profile.isPremium && !isPremiumUser ? (
          <button
            onClick={() => onUpgradePremium()}
            className="w-full text-center text-[9px] font-bold py-1.5 px-1.5 rounded-lg mb-1.5 active:scale-95 transition-transform"
            style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.18 0.12 290)" }}
          >
            Upgrade to Premium<br />to chat with this member
          </button>
        ) : !isPremiumUser ? (
          <button
            onClick={() => onUnlock(profile.id)}
            className="flex items-center gap-1.5 mb-1.5 w-full active:scale-95 transition-transform"
          >
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
              style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.18 0.12 290)" }}
            >
              K20
            </span>
            <span className="text-[9px] text-left" style={{ color: "oklch(0.50 0.08 290)" }}>
              Once off payment<br />to unlock chat
            </span>
          </button>
        ) : (
          <div className="mb-1.5 h-5" />
        )}

        {/* Faith & Occupation */}
        <div
          className="text-[10px] font-medium text-center py-1 rounded-lg"
          style={{ background: "oklch(0.22 0.18 290)", color: "oklch(0.85 0.05 290)" }}
        >
          {profile.denomination ?? "Christian"}{profile.occupation ? ` • ${profile.occupation}` : ""}
        </div>
      </div>
    </div>
  );
}

// ─── Love Stories Slider ──────────────────────────────────────────────────────
function LoveStoriesSlider({ stories }: { stories: { id: number; coupleName: string; location: string; quoteTitle: string; story: string; photoUrl: string | null }[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stories.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % stories.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [stories.length]);

  if (stories.length === 0) return null;

  const story = stories[idx]!;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "oklch(0.98 0.005 290)", border: "1px solid oklch(0.90 0.04 290)", boxShadow: "0 4px 16px oklch(0 0 0 / 0.08)" }}
    >
      <div className="flex gap-0">
        {/* Couple photo */}
        <div className="flex-shrink-0 relative" style={{ width: 130, minHeight: 200 }}>
          {story.photoUrl ? (
            <img src={story.photoUrl} alt={story.coupleName} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "oklch(0.90 0.06 290)", minHeight: 200 }}
            >
              {/* Faithful Hearts logo watermark */}
              <div className="flex flex-col items-center gap-1 opacity-30">
                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                  <path d="M20 35C20 35 5 26 5 15a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 11-15 20-15 20z" fill="oklch(0.72 0.16 80)" />
                  <line x1="20" y1="14" x2="20" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="14" y1="19" x2="26" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Story content */}
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "oklch(0.94 0.06 80)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                    <path d="M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13z" fill="oklch(0.72 0.16 80)" />
                    <line x1="12" y1="7" x2="12" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="9" y1="10.5" x2="15" y2="10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="font-bold text-xs" style={{ color: "oklch(0.28 0.20 290)" }}>Love Stories</span>
              </div>
              {stories.length > 1 && (
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.90 0.04 290)", color: "oklch(0.45 0.12 290)" }}
                >
                  {idx + 1}/{stories.length}
                </span>
              )}
            </div>

            {/* Quote title */}
            <p className="font-bold text-sm leading-tight mb-1" style={{ color: "oklch(0.22 0.18 290)" }}>
              {story.quoteTitle} 💜
            </p>

            {/* Location */}
            <div className="flex items-center gap-1 mb-2">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" style={{ color: "oklch(0.55 0.12 290)" }} />
              <span className="text-[10px]" style={{ color: "oklch(0.55 0.12 290)" }}>
                {story.coupleName} | {story.location}
              </span>
            </div>

            {/* Story text */}
            <p className="text-[10px] leading-relaxed italic" style={{ color: "oklch(0.40 0.10 290)" }}>
              {story.story.length > 160 ? story.story.slice(0, 157) + "..." : story.story}
            </p>
          </div>

          {/* Tagline */}
          <p className="text-[9px] mt-2" style={{ color: "oklch(0.55 0.12 290)" }}>
            God writes the best love stories. ✨
          </p>
        </div>
      </div>

      {/* Dot indicators */}
      {stories.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all"
              style={{
                width: i === idx ? 16 : 6,
                height: 6,
                background: i === idx ? "oklch(0.28 0.20 290)" : "oklch(0.80 0.04 290)",
              }}
              aria-label={`Story ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main HomeTab Component ───────────────────────────────────────────────────
export default function HomeTab({
  onTabChange,
}: {
  onTabChange: (tab: string) => void;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const utils = trpc.useUtils();

  // Data queries
  const { data: suggestedProfiles, isLoading: loadingSuggested } = trpc.home.suggestedProfiles.useQuery();
  const { data: loveStories, isLoading: loadingStories } = trpc.home.loveStories.useQuery();
  const { data: announcements, isLoading: loadingAnnouncements } = trpc.home.announcements.useQuery();
  const { data: premiumStatus } = trpc.profile.premiumStatus.useQuery();
  const { data: completionData } = trpc.profile.completionScore.useQuery();
  const { data: notifCountData } = trpc.home.notificationCount.useQuery();

  const isPremium = premiumStatus?.isPremium ?? user?.isPremium ?? false;
  // Default to 0 so card is always visible until real data loads
  const completionScore = completionData?.score ?? 0;
  const notificationCount = notifCountData?.count ?? 0;

  const firstName = user?.name?.split(" ")[0] ?? "Friend";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const verseIndex = new Date().getDate() % DAILY_VERSES.length;
  const verse = DAILY_VERSES[verseIndex]!;

  const handleUnlockChat = (userId: number) => {
    if (isPremium) {
      navigate(`/chat/${userId}`);
    } else {
      setSelectedUserId(userId);
      setShowPayment(true);
    }
  };

  const handleLike = (userId: number) => {
    toast.success("Liked! ❤️");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Daily Bible Verse — Faithful Hearts",
        text: `"${verse.text}" — ${verse.ref}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`"${verse.text}" — ${verse.ref}`).then(() => {
        toast.success("Verse copied to clipboard!");
      });
    }
  };

  // Fallback love stories (shown when DB is empty)
  const fallbackStories = [
    {
      id: 1,
      coupleName: "Tendai & Wezi",
      location: "Harare, Zimbabwe",
      quoteTitle: "Faith brought us together, love keeps us walking in purpose.",
      story: "We met on Faithful Hearts while trusting God for a life partner. Through prayer, patience, and faith, He led us to each other. Today, we're building a Christ-centered marriage and a life of purpose together.",
      photoUrl: null,
    },
    {
      id: 2,
      coupleName: "Chanda & Mwila",
      location: "Lusaka, Zambia",
      quoteTitle: "God's timing is always perfect.",
      story: "After years of praying for a godly partner, I found Mwila on Faithful Hearts. Our shared faith and values made it clear God had written our story long before we met.",
      photoUrl: null,
    },
    {
      id: 3,
      coupleName: "Emmanuel & Grace",
      location: "Ndola, Zambia",
      quoteTitle: "He who finds a wife finds what is good.",
      story: "We both joined Faithful Hearts seeking a God-fearing partner. Six months later, we were engaged. Our relationship is built on prayer, trust, and a shared love for Christ.",
      photoUrl: null,
    },
  ];

  const displayStories = (loveStories && loveStories.length > 0) ? loveStories : fallbackStories;

  // Fallback announcements
  const fallbackAnnouncements = [
    {
      id: 1,
      title: "Community Prayer Night",
      content: "Community Prayer Night is this Friday at 19:00 CAT. Join us as we come together in faith and unity.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  const displayAnnouncements = (announcements && announcements.length > 0) ? announcements : fallbackAnnouncements;
  const latestAnnouncement = displayAnnouncements[0];

  const timeAgo = (date: Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "oklch(0.97 0.008 290)" }}>
      {/* Duplicate inner header removed — Browse.tsx purple header is the single top header */}

      {/* ── Scrollable Content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* ── Greeting + Go Premium card ─────────────────────────── */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-xl leading-tight" style={{ color: "oklch(0.18 0.12 290)" }}>
              {greeting},{" "}
              <span style={{ color: "oklch(0.72 0.16 80)" }}>{firstName}!</span>
              {" "}✨
            </p>
            <p className="text-sm mt-0.5" style={{ color: "oklch(0.50 0.08 290)" }}>
              Let your faith guide your heart.
            </p>
          </div>

          {/* Go Premium card */}
          {/* Premium card — always visible: upgrade prompt for free users, status badge for premium users */}
          {isPremium ? (
            <div
              className="flex-shrink-0 rounded-2xl p-3 flex items-center gap-2.5"
              style={{
                background: "oklch(0.22 0.18 290)",
                border: "1px solid oklch(0.72 0.16 80 / 0.55)",
                minWidth: 160,
                maxWidth: 180,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.72 0.16 80 / 0.20)", border: "1px solid oklch(0.72 0.16 80 / 0.5)" }}
              >
                <svg viewBox="0 0 24 24" fill="oklch(0.72 0.16 80)" className="w-5 h-5">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3h10v2H7v-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>Premium</p>
                <p className="text-[9px] mt-0.5" style={{ color: "oklch(0.70 0.05 290)" }}>✓ All features active</p>
                <p className="text-[9px]" style={{ color: "oklch(0.70 0.05 290)" }}>✓ Unlimited matches</p>
                <p className="text-[9px] mt-1 font-semibold" style={{ color: "oklch(0.72 0.16 80)" }}>Active Member</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPremium(true)}
              className="flex-shrink-0 rounded-2xl p-3 flex items-center gap-2.5 active:scale-[0.97] transition-transform"
              style={{
                background: "oklch(0.22 0.18 290)",
                border: "1px solid oklch(0.72 0.16 80 / 0.35)",
                minWidth: 160,
                maxWidth: 180,
              }}
            >
              {/* Crown icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.72 0.16 80 / 0.15)", border: "1px solid oklch(0.72 0.16 80 / 0.4)" }}
              >
                <svg viewBox="0 0 24 24" fill="oklch(0.72 0.16 80)" className="w-5 h-5">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2 3h10v2H7v-2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>Go Premium</p>
                <p className="text-[9px] mt-0.5" style={{ color: "oklch(0.70 0.05 290)" }}>✓ Chat with all members</p>
                <p className="text-[9px]" style={{ color: "oklch(0.70 0.05 290)" }}>✓ See who liked you</p>
                <p className="text-[9px]" style={{ color: "oklch(0.70 0.05 290)" }}>✓ Unlimited matches</p>
                <p className="text-[9px] mt-1 font-semibold" style={{ color: "oklch(0.72 0.16 80)" }}>
                  K50 first month | K100 after
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.72 0.16 80)" }} />
            </button>
          )}
        </div>

        {/* ── Daily Bible Verse ───────────────────────────────────── */}
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ minHeight: 160 }}
          >
            {/* Background image */}
            <img
              src={BIBLE_VERSE_BG}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            {/* Dark overlay */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(10,5,30,0.82) 0%, rgba(10,5,30,0.55) 60%, rgba(10,5,30,0.30) 100%)" }}
            />

            {/* Content */}
            <div className="relative z-10 p-4">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.28 0.20 290 / 0.8)" }}
                  >
                    {/* Book icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-4 h-4">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <span className="font-bold text-white text-sm">Daily Bible Verse</span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "oklch(0.28 0.20 290 / 0.7)", color: "white", border: "1px solid white/20" }}
                >
                  Share
                  <Share2 className="w-3 h-3" />
                </button>
              </div>

              {/* Verse text */}
              <p className="text-white font-medium text-sm leading-relaxed mb-2">
                " {verse.text} "
              </p>
              <p className="font-bold text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>
                — {verse.ref}
              </p>
            </div>
          </div>
        </div>

        {/* ── Suggested For You ───────────────────────────────────── */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 mb-2.5">
            <span className="font-bold text-sm" style={{ color: "oklch(0.22 0.18 290)" }}>Suggested for you</span>
            <button
              onClick={() => onTabChange("swipe")}
              className="text-xs font-semibold"
              style={{ color: "oklch(0.45 0.18 290)" }}
            >
              View all
            </button>
          </div>

          {loadingSuggested ? (
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-2xl animate-pulse"
                  style={{ width: 160, height: 280, background: "oklch(0.90 0.04 290)" }}
                />
              ))}
            </div>
          ) : suggestedProfiles && suggestedProfiles.length > 0 ? (
            <div className="flex gap-3 px-4 overflow-x-auto no-scrollbar pb-1">
              {suggestedProfiles.map((profile) => (
                <SuggestedProfileCard
                  key={profile.id}
                  profile={profile}
                  onUnlock={handleUnlockChat}
                  onLike={handleLike}
                  onUpgradePremium={() => setShowPremium(true)}
                  isPremiumUser={isPremium}
                />
              ))}
            </div>
          ) : (
            <div className="px-4">
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "oklch(0.94 0.04 290)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "oklch(0.45 0.12 290)" }}>No profiles yet</p>
                <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.08 290)" }}>Be the first to join!</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Love Stories ────────────────────────────────────────── */}
        <div className="px-4 mb-4">
          {!loadingStories && <LoveStoriesSlider stories={displayStories} />}
        </div>

        {/* ── Updates / Announcements ─────────────────────────────── */}
        {latestAnnouncement && (
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-3.5 flex items-start gap-3"
              style={{ background: "oklch(0.22 0.18 290)" }}
            >
              {/* Megaphone icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "oklch(0.45 0.18 290)" }}
              >
                <Megaphone className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-xs tracking-wide">UPDATES</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "oklch(0.45 0.18 290)", color: "white" }}
                  >
                    NEW
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => onTabChange("notifications")}
                    className="text-[10px] font-semibold"
                    style={{ color: "oklch(0.72 0.16 80)" }}
                  >
                    View all
                  </button>
                </div>
                <p className="text-white/90 text-xs leading-relaxed">
                  {latestAnnouncement.content}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "oklch(0.65 0.20 145)" }}
                  />
                  <span className="text-white/50 text-[10px]">
                    {timeAgo(latestAnnouncement.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

           {/* ── Complete Your Profile — always visible ────────────────── */}
          <div className="px-4 mb-4">
            <div
              className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "oklch(0.98 0.005 290)", border: `1px solid ${completionScore >= 100 ? "oklch(0.65 0.20 145 / 0.4)" : "oklch(0.90 0.04 290)"}`, boxShadow: "0 4px 16px oklch(0 0 0 / 0.06)" }}
            >
              {/* Circular progress */}
              <div className="flex-shrink-0 relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="oklch(0.90 0.04 290)" strokeWidth="5" />
                  <circle
                    cx="28" cy="28" r="22" fill="none"
                    stroke={completionScore >= 100 ? "oklch(0.65 0.20 145)" : "oklch(0.72 0.16 80)"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 22}`}
                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(completionScore, 100) / 100)}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  {completionScore >= 100 ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="oklch(0.65 0.20 145)" strokeWidth={2.5} className="w-5 h-5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="font-bold text-xs" style={{ color: "oklch(0.28 0.20 290)" }}>
                      {completionScore}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {completionScore >= 100 ? (
                  <>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.22 0.18 290)" }}>Profile Complete!</p>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.08 290)" }}>
                      Your profile is fully set up. You're getting the best matches.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-sm" style={{ color: "oklch(0.22 0.18 290)" }}>Complete your profile</p>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.08 290)" }}>
                      A complete profile gets you more matches and better connections
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={() => navigate("/edit-profile")}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl font-bold text-xs"
                style={{ background: completionScore >= 100 ? "oklch(0.65 0.20 145)" : "oklch(0.28 0.20 290)", color: "white" }}
              >
                {completionScore >= 100 ? "View Profile" : "Complete Now"}
              </button>
            </div>
          </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {showPayment && selectedUserId && (
        <PaymentModal
          targetId={selectedUserId}
          targetName={suggestedProfiles?.find((u) => u.id === selectedUserId)?.name ?? "this member"}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            navigate(`/chat/${selectedUserId}`);
          }}
        />
      )}

      {showPremium && (
        <PremiumCheckoutModal
          onClose={() => setShowPremium(false)}
          onSuccess={() => {
            setShowPremium(false);
            utils.profile.premiumStatus.invalidate();
            utils.auth.me.invalidate();
            toast.success("Welcome to Premium! 🎉");
          }}
        />
      )}
    </div>
  );
}
