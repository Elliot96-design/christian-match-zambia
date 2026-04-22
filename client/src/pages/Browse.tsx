import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import {
  Bell,
  Crown,
  Heart,
  Home,
  Lock,
  MapPin,
  MessageCircle,
  RefreshCw,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Chipata", "Kasama", "Solwezi",
  "Mongu", "Mansa", "Choma", "Mazabuka", "Kafue", "Other",
];

const DAILY_VERSES = [
  { text: "Commit to the Lord whatever you do, and he will establish your plans.", ref: "Proverbs 16:3" },
  { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast.", ref: "1 Corinthians 13:4" },
  { text: "He who finds a wife finds what is good and receives favour from the Lord.", ref: "Proverbs 18:22" },
];

type Tab = "home" | "swipe" | "chat" | "profile" | "chatroom";

export default function Browse() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [filterGender, setFilterGender] = useState<"male" | "female" | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const verseIndex = new Date().getDate() % DAILY_VERSES.length;
  const verse = DAILY_VERSES[verseIndex]!;

  const { data: users, isLoading, refetch } = trpc.browse.list.useQuery(
    { gender: filterGender, location: filterLocation, offset },
    { enabled: !!isAuthenticated && !loading }
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) { navigate("/"); return null; }
  if (user && !user.profileComplete) { navigate("/setup"); return null; }

  const firstName = user?.name?.split(" ")[0] ?? "Friend";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const currentCard = users && users.length > 0 ? users[cardIndex % users.length] : null;

  const handleSwipeNext = () => setCardIndex((i) => i + 1);
  const handleSwipeLike = () => {
    toast.success("Liked! ❤️");
    setCardIndex((i) => i + 1);
  };

  const handleUnlockChat = (userId: number) => {
    setSelectedUserId(userId);
    setShowPayment(true);
  };

  // ── Bottom nav items ──────────────────────────────────────
  const navItems: { id: Tab; icon: React.ReactNode; label: string }[] = [
    {
      id: "home",
      label: "Home",
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: "swipe",
      label: "Swipe",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      id: "chat",
      label: "Chat",
      icon: <MessageCircle className="w-5 h-5" />,
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      id: "chatroom",
      label: "Chatroom",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  // ── Render content for active tab ─────────────────────────
  const renderContent = () => {
    if (activeTab === "swipe") {
      return (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">Discover Members</h2>
          {/* Filter row */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
            {(["male", "female"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(filterGender === g ? undefined : g)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                  filterGender === g
                    ? "bg-primary text-white"
                    : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                {g === "male" ? "Men" : "Women"}
              </button>
            ))}
            {ZAMBIA_LOCATIONS.slice(0, 5).map((loc) => (
              <button
                key={loc}
                onClick={() => setFilterLocation(filterLocation === loc ? undefined : loc)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-colors ${
                  filterLocation === loc
                    ? "bg-primary text-white"
                    : "bg-secondary text-secondary-foreground border border-border"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          {/* User grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">No members found</p>
              <p className="text-muted-foreground text-sm mt-1">Be the first to join!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/profile/${u.id}`)}
                  className="profile-card bg-card text-left"
                >
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {u.photoUrl ? (
                      <img src={u.photoUrl} alt={u.name ?? ""} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-primary/30">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white font-semibold text-sm">{u.name ?? "Member"}, {u.age ?? "?"}</p>
                      {u.church && <p className="text-white/70 text-xs truncate">{u.church}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {users && users.length >= 10 && (
            <button
              onClick={() => setOffset((o) => o + 10)}
              className="w-full mt-4 h-12 rounded-2xl border border-border text-sm font-medium text-primary"
            >
              Load more
            </button>
          )}
        </div>
      );
    }

    if (activeTab === "chat") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">Your Chats</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">
            Unlock a chat by visiting a member's profile and paying K15 to start a conversation.
          </p>
          <button
            onClick={() => setActiveTab("swipe")}
            className="btn-purple mt-6 px-8 py-3 text-sm"
          >
            Browse Members
          </button>
        </div>
      );
    }

    if (activeTab === "profile") {
      return (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-primary/40">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-bold text-foreground text-lg">{user?.name ?? "Your Name"}</p>
              <p className="text-muted-foreground text-sm">{(user as any)?.church ?? "Add your church"}</p>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/edit-profile")}
              className="w-full h-14 rounded-2xl border border-border bg-white flex items-center px-4 gap-3 text-sm font-medium text-foreground"
            >
              <Settings className="w-5 h-5 text-primary" />
              Edit Profile
            </button>
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="w-full h-14 rounded-2xl border border-border bg-white flex items-center px-4 gap-3 text-sm font-medium text-foreground"
              >
                <Shield className="w-5 h-5 text-primary" />
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full h-14 rounded-2xl border border-destructive/30 bg-white flex items-center px-4 gap-3 text-sm font-medium text-destructive"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "chatroom") {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">Community Chatroom</h3>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs">
            Group discussions for the Faithful Hearts community — coming soon for Premium members.
          </p>
          <div className="badge-premium mt-4 inline-flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            Premium Feature
          </div>
        </div>
      );
    }

    // ── HOME tab (default) ────────────────────────────────────
    return (
      <div className="flex-1 overflow-y-auto">
        {/* Greeting */}
        <div className="hero-gradient px-5 pt-5 pb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-white font-bold text-lg">
                {greeting}, {firstName}! ✨
              </p>
              <p className="text-white/70 text-sm">Let your faith guide your heart.</p>
            </div>
            <button className="btn-gold flex items-center gap-1.5 px-3 py-2 text-xs">
              <Crown className="w-3.5 h-3.5" />
              Go Premium
            </button>
          </div>
        </div>

        <div className="px-4 -mt-3 space-y-4 pb-6">
          {/* Profile swipe card */}
          {isLoading ? (
            <div className="profile-card bg-muted h-80 animate-pulse" />
          ) : currentCard ? (
            <div className="profile-card relative">
              {/* Photo */}
              <div className="relative h-80 bg-muted">
                {currentCard.photoUrl ? (
                  <img
                    src={currentCard.photoUrl}
                    alt={currentCard.name ?? "Member"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 text-primary/30">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                )}

                {/* New badge */}
                <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  New
                </div>

                {/* Like button top-right */}
                <button
                  onClick={handleSwipeLike}
                  className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
                >
                  <Heart className="w-5 h-5 text-primary" />
                </button>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-3">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-bold text-xl">{currentCard.name ?? "Member"}, {currentCard.age ?? "?"}</p>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400 flex-shrink-0">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {currentCard.church && (
                    <p className="text-white/80 text-sm">{currentCard.church}</p>
                  )}
                  {currentCard.location && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-white/60" />
                      <span className="text-white/70 text-xs">{currentCard.location}</span>
                      <span className="text-white/50 text-xs">+</span>
                      <span className="text-white/70 text-xs">Christian</span>
                      <span className="text-white/50 text-xs">+</span>
                      <span className="text-white/70 text-xs">Looking for a God-centred partner</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-6 py-4 bg-white">
                <button
                  onClick={handleSwipeNext}
                  className="w-14 h-14 rounded-full border-2 border-muted flex items-center justify-center shadow-sm"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
                <button
                  onClick={handleSwipeLike}
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-md"
                  style={{ background: "oklch(0.28 0.20 290)" }}
                >
                  <Heart className="w-6 h-6 text-white fill-white" />
                </button>
              </div>

              {/* Unlock chat banner */}
              <button
                onClick={() => handleUnlockChat(currentCard.id)}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-semibold"
                style={{ background: "oklch(0.28 0.20 290)" }}
              >
                <Lock className="w-4 h-4" />
                Pay <span className="text-gold font-bold">K15</span> to permanently unlock chat with {currentCard.name?.split(" ")[0] ?? "them"}
              </button>
            </div>
          ) : (
            <div className="profile-card bg-white flex flex-col items-center justify-center py-16 text-center px-6">
              <Users className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">No members found</p>
              <p className="text-muted-foreground text-sm mt-1">Be the first to join!</p>
              <button onClick={() => refetch()} className="mt-4 flex items-center gap-2 text-primary text-sm font-medium">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          )}

          {/* Premium upsell card */}
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "oklch(0.96 0.02 290)", border: "1px solid oklch(0.88 0.04 290)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.28 0.20 290)" }}>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Premium Members Unlock More</p>
              <p className="text-muted-foreground text-xs mt-0.5">Like, match, and start meaningful conversations. Upgrade now to connect.</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-muted-foreground flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          {/* Community Spotlight / Daily Verse */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-foreground">Community Spotlight</p>
              <button className="text-primary text-sm font-medium">View All</button>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.10 60) 0%, oklch(0.45 0.12 55) 100%)" }}
            >
              <div className="p-4 flex gap-3">
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-1">Daily Verse</p>
                  <p className="text-white/90 text-sm italic leading-relaxed">
                    "{verse.text}"
                  </p>
                  <p className="text-white/70 text-xs mt-2">— {verse.ref}</p>
                </div>
                <div className="w-16 flex items-center justify-center opacity-30">
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
    <div className="min-h-screen bg-background flex flex-col max-w-[480px] mx-auto">
      {/* Top header */}
      <header className="hero-gradient px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setActiveTab("home")}
          className="w-9 h-9 flex items-center justify-center rounded-lg"
        >
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
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-primary text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {/* 5-tab bottom nav */}
      <nav className="bottom-nav flex-shrink-0 flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "chatroom" || item.id === "chat") {
                  setActiveTab(item.id);
                } else {
                  setActiveTab(item.id);
                }
              }}
              className="flex flex-col items-center gap-1 py-1 px-3 relative"
            >
              <span className={isActive ? "text-gold" : "text-white/50"}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? "text-gold" : "text-white/50"}`}>
                {item.label}
              </span>
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
              )}
              {/* Chat notification dot */}
              {item.id === "chat" && !isActive && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-yellow-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Payment modal */}
      {showPayment && selectedUserId && (
        <PaymentModal
          targetId={selectedUserId}
          targetName={users?.find((u) => u.id === selectedUserId)?.name ?? "this member"}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            navigate(`/chat/${selectedUserId}`);
          }}
        />
      )}
    </div>
  );
}
