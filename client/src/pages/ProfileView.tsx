import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Church, Lock, MapPin, MessageCircle, User } from "lucide-react";
import { useState } from "react";
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

  if (!isAuthenticated) { navigate("/"); return null; }

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
    <div className="min-h-screen bg-background pb-6">
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

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h1 className="text-white text-2xl font-bold">{profile.name ?? "Anonymous"}</h1>
          <p className="text-white/80 text-sm">
            {profile.age ? `${profile.age} years old` : ""}
            {profile.age && profile.gender ? " · " : ""}
            {profile.gender ? (profile.gender === "male" ? "Male" : "Female") : ""}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="container py-5 space-y-5">
        {/* Location & Church */}
        <div className="flex flex-wrap gap-3">
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
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">About</p>
            <p className="text-foreground text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Chat Button */}
        {!isOwnProfile && (
          <div className="pt-2">
            {isUnlocked ? (
              <Button
                className="w-full h-12 text-base rounded-xl"
                onClick={() => navigate(`/chat/${profile.id}`)}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Open Chat
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => setShowPayment(true)}
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Unlock chat to start conversation
                </Button>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-amber-800 text-xs font-medium">
                    One-time payment of K10 to unlock private chat with {profile.name?.split(" ")[0] ?? "this person"}.
                    Chat stays unlocked permanently.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {isOwnProfile && (
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl"
            onClick={() => navigate("/edit-profile")}
          >
            Edit My Profile
          </Button>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && profile && (
        <PaymentModal
          targetId={profile.id}
          targetName={profile.name ?? "this person"}
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
