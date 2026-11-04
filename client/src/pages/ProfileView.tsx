import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import { ArrowLeft, Church, Crown, Lock, MapPin, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import PaymentModal from "@/components/PaymentModal";

export default function ProfileView() {
  const { id } = useParams<{ id: string }>();
  const userId = parseInt(id ?? "0");
  const { user: me, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showPayment, setShowPayment] = useState(false);

  const { data: profile, isLoading } = trpc.profile.get.useQuery(
    { userId },
    { enabled: !!isAuthenticated && !!userId }
  );

  const { data: unlockStatus, refetch: refetchUnlock } = trpc.chat.checkUnlock.useQuery(
    { targetId: userId },
    { enabled: !!isAuthenticated && !!userId && userId !== me?.id }
  );

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-72 bg-muted animate-pulse" />
        <div className="container py-4 space-y-3">
          <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Profile not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/browse")}>
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = me?.id === profile.id;
  const isUnlocked = unlockStatus?.unlocked ?? false;

  return (
    <div className="min-h-screen bg-background pb-6 max-w-[480px] mx-auto">
      {/* Photo Header */}
      <div className="relative">
        <div className="aspect-[4/5] bg-muted overflow-hidden max-h-[420px]">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name ?? "Member"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <User className="w-20 h-20 text-primary/30" />
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate("/browse")}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Logo centre */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <img src={LOGO_URL} alt="Faithful Hearts" className="w-9 h-9 rounded-xl object-cover shadow-sm opacity-90" />
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-2">
            <h1 className="text-white text-2xl font-bold font-display">{profile.name ?? "Anonymous"}</h1>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white/80 text-sm">
            {profile.age ? `${profile.age} years old` : ""}
            {profile.age && profile.gender ? " · " : ""}
            {profile.gender ? (profile.gender === "male" ? "Male" : "Female") : ""}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="container py-5 space-y-5">
        {/* Location & Church tags */}
        <div className="flex flex-wrap gap-2">
          {profile.location && (
            <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-foreground font-medium">{profile.location}</span>
            </div>
          )}
          {profile.church && (
            <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
              <Church className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-foreground font-medium">{profile.church}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-sm font-semibold text-foreground mb-1">About</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Premium upsell */}
        {!isOwnProfile && !isUnlocked && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "oklch(0.96 0.02 290)", border: "1px solid oklch(0.88 0.04 290)" }}>
            <Crown className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Premium Members</span> can unlock unlimited chats and build meaningful connections.
            </p>
          </div>
        )}

        {/* Chat action */}
        {!isOwnProfile && (
          <div>
            {isUnlocked ? (
              <button
                onClick={() => navigate(`/chat/${profile.id}`)}
                className="btn-purple w-full h-14 flex items-center justify-center gap-2 text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Open Chat
              </button>
            ) : (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full h-14 flex items-center justify-center gap-2 text-white text-base font-semibold rounded-2xl"
                style={{ background: "oklch(0.28 0.20 290)" }}
              >
                <Lock className="w-5 h-5" />
                <span>
                  Pay <span className="text-gold font-bold">K20</span> to unlock chat with {profile.name?.split(" ")[0] ?? "them"}
                </span>
              </button>
            )}
            {!isUnlocked && (
              <p className="text-center text-muted-foreground text-xs mt-2">
                Unlock chat to start conversation · One-time payment per person
              </p>
            )}
          </div>
        )}

        {isOwnProfile && (
          <button
            onClick={() => navigate("/edit-profile")}
            className="btn-purple w-full h-14 flex items-center justify-center gap-2 text-base"
          >
            Edit My Profile
          </button>
        )}
      </div>

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          targetId={profile.id}
          targetName={profile.name ?? "this member"}
          onClose={() => setShowPayment(false)}
          onSuccess={() => {
            setShowPayment(false);
            refetchUnlock();
            navigate(`/chat/${profile.id}`);
          }}
        />
      )}
    </div>
  );
}
