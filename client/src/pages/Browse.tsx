import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  LogOut,
  MapPin,
  MessageCircle,
  Settings,
  SlidersHorizontal,
  User,
  X,
  Shield,
} from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Chipata", "Kasama", "Solwezi",
  "Mongu", "Mansa", "Choma", "Mazabuka", "Kafue", "Other"
];

export default function Browse() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [filterGender, setFilterGender] = useState<"male" | "female" | undefined>();
  const [filterLocation, setFilterLocation] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  if (user && !user.profileComplete) {
    navigate("/setup");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Christian Match Zambia" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
          <span className="font-semibold text-foreground text-sm">Christian Match</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${
              showFilters || filterGender || filterLocation
                ? "bg-primary text-white border-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-muted active:bg-muted/70"
          >
            <LogOut className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white border-b border-border px-4 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground">Filters</p>
            {(filterGender || filterLocation) && (
              <button
                onClick={() => { setFilterGender(undefined); setFilterLocation(undefined); setOffset(0); }}
                className="text-xs text-primary"
              >
                Clear all
              </button>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Gender</p>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => { setFilterGender(filterGender === g ? undefined : g); setOffset(0); }}
                  className={`px-4 h-9 rounded-full border text-sm font-medium transition-colors ${
                    filterGender === g
                      ? "bg-primary text-white border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  {g === "male" ? "👨 Men" : "👩 Women"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Location</p>
            <div className="flex flex-wrap gap-2">
              {ZAMBIA_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => { setFilterLocation(filterLocation === loc ? undefined : loc); setOffset(0); }}
                  className={`px-3 h-8 rounded-full border text-xs font-medium transition-colors ${
                    filterLocation === loc
                      ? "bg-primary text-white border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container py-4">
        {user?.isBanned ? (
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="font-semibold text-foreground">Account Suspended</p>
            <p className="text-muted-foreground text-sm mt-1">Your account has been suspended. Contact support.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold text-foreground">No members found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {filterGender || filterLocation ? "Try adjusting your filters" : "Be the first to join!"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {users.length} member{users.length !== 1 ? "s" : ""} found
              {filterGender ? ` · ${filterGender}` : ""}
              {filterLocation ? ` · ${filterLocation}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {users.map((u) => (
                <UserCard key={u.id} user={u} onPress={() => navigate(`/profile/${u.id}`)} />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              {offset > 0 && (
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setOffset(Math.max(0, offset - 20))}
                >
                  Previous
                </Button>
              )}
              {users.length === 20 && (
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={() => setOffset(offset + 20)}
                >
                  Load More
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <BottomNav active="browse" />
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function UserCard({ user, onPress }: { user: { id: number; name: string | null; age: number | null; church: string | null; photoUrl: string | null; location: string | null }; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="bg-card border border-border rounded-2xl overflow-hidden text-left active:scale-95 transition-transform"
    >
      <div className="aspect-[3/4] bg-muted relative overflow-hidden">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.name ?? "Member"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <User className="w-10 h-10 text-primary/40" />
          </div>
        )}
        {user.location && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {user.location}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-foreground text-sm truncate">{user.name ?? "Anonymous"}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {user.age ? `${user.age} yrs` : ""}
          {user.age && user.church ? " · " : ""}
          {user.church ? <span className="truncate">{user.church}</span> : ""}
        </p>
      </div>
    </button>
  );
}
