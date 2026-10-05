import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Heart, MapPin, Users } from "lucide-react";

const LOGO_URL = "/faithful-hearts-logo.svg";

const ZAMBIA_LOCATIONS = [
  "Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira",
  "Livingstone", "Luanshya", "Kasama", "Chipata", "Solwezi",
  "Mazabuka", "Choma", "Mongu", "Mansa", "Kafue", "Other",
];

export default function RelationshipPrefs() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [lookingFor, setLookingFor] = useState<"marriage" | "friendship" | "dating" | "not_sure" | "">("");
  const [ageRangeMin, setAgeRangeMin] = useState<number>(18);
  const [ageRangeMax, setAgeRangeMax] = useState<number>(45);
  const [preferredLocation, setPreferredLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const { data: faithData, isLoading } = trpc.faithProfile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (faithData) {
      setLookingFor((faithData.lookingFor as typeof lookingFor) ?? "");
      setAgeRangeMin(faithData.ageRangeMin ?? 18);
      setAgeRangeMax(faithData.ageRangeMax ?? 45);
      setPreferredLocation(faithData.preferredLocation ?? "");
    }
  }, [faithData]);

  const utils = trpc.useUtils();
  const updateMutation = trpc.faithProfile.updateRelationshipPrefs.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved!");
      utils.faithProfile.get.invalidate();
      utils.profile.completionScore.invalidate();
      navigate("/browse?tab=profile");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    if (ageRangeMin > ageRangeMax) {
      toast.error("Minimum age cannot be greater than maximum age.");
      return;
    }
    setSaving(true);
    updateMutation.mutate({
      lookingFor: lookingFor || undefined,
      ageRangeMin,
      ageRangeMax,
      preferredLocation: preferredLocation || undefined,
    });
    setSaving(false);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#2D0A6B] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2D0A6B] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3D0C7A] to-[#2D0A6B] px-4 pt-5 pb-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate("/browse?tab=profile")}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <img src={LOGO_URL} alt="Faithful Hearts" className="w-8 h-8 rounded-lg object-cover" />
        <div>
          <h1 className="text-white font-bold text-base leading-tight">Relationship Preferences</h1>
          <p className="text-purple-300 text-xs">What you're looking for in a partner</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        {/* Looking For */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">I am looking for</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "marriage", label: "Marriage", icon: "💍", desc: "Ready to build a life together" },
              { value: "dating", label: "Dating", icon: "💑", desc: "Getting to know someone special" },
              { value: "friendship", label: "Friendship", icon: "🤝", desc: "Faith-based connections first" },
              { value: "not_sure", label: "Not Sure Yet", icon: "🌱", desc: "Open to where God leads" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLookingFor(opt.value as typeof lookingFor)}
                className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border transition-colors text-center ${
                  lookingFor === opt.value
                    ? "bg-amber-500/20 border-amber-500 text-white"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] text-purple-300 leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Preferred Age Range</label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-purple-300 text-xs mb-1 block">Min Age</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgeRangeMin(Math.max(18, ageRangeMin - 1))}
                  className="w-9 h-9 rounded-full bg-purple-700/50 text-white font-bold text-lg flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-white font-bold text-xl w-8 text-center">{ageRangeMin}</span>
                <button
                  onClick={() => setAgeRangeMin(Math.min(ageRangeMax, ageRangeMin + 1))}
                  className="w-9 h-9 rounded-full bg-purple-700/50 text-white font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-purple-400 font-bold">to</div>
            <div className="flex-1">
              <label className="text-purple-300 text-xs mb-1 block">Max Age</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAgeRangeMax(Math.max(ageRangeMin, ageRangeMax - 1))}
                  className="w-9 h-9 rounded-full bg-purple-700/50 text-white font-bold text-lg flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-white font-bold text-xl w-8 text-center">{ageRangeMax}</span>
                <button
                  onClick={() => setAgeRangeMax(Math.min(100, ageRangeMax + 1))}
                  className="w-9 h-9 rounded-full bg-purple-700/50 text-white font-bold text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          <p className="text-purple-400 text-xs mt-3 text-center">
            Looking for someone aged {ageRangeMin}–{ageRangeMax}
          </p>
        </div>

        {/* Preferred Location */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Preferred Location</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ZAMBIA_LOCATIONS.map((loc) => (
              <button
                key={loc}
                onClick={() => setPreferredLocation(preferredLocation === loc ? "" : loc)}
                className={`px-2 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  preferredLocation === loc
                    ? "bg-amber-500 border-amber-500 text-black"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
          <p className="text-purple-400 text-xs mt-2">
            Leave blank to match with anyone in Zambia
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || updateMutation.isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base transition-colors"
        >
          {updateMutation.isPending ? "Saving..." : "Save Preferences"}
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
}
