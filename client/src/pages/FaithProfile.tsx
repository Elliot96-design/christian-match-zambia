import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Church, Heart, Sun } from "lucide-react";

const LOGO_URL = "/manus-storage/faithful-hearts-logo_b31fd195.png";

const DENOMINATIONS = [
  "Pentecostal",
  "Catholic",
  "Anglican",
  "Baptist",
  "Seventh-day Adventist",
  "United Church of Zambia",
  "Reformed",
  "Evangelical",
  "Methodist",
  "Charismatic",
  "Non-denominational",
  "Other",
];

const BIBLE_VERSIONS = ["NIV", "KJV", "NKJV", "ESV", "NLT", "MSG", "NASB", "AMP", "Other"];

export default function FaithProfile() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [denomination, setDenomination] = useState("");
  const [faithLevel, setFaithLevel] = useState<"growing" | "committed" | "deeply_rooted" | "">("");
  const [bibleVersion, setBibleVersion] = useState("");
  const [prayerFrequency, setPrayerFrequency] = useState<"daily" | "weekly" | "occasionally" | "">("");
  const [church, setChurch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  const { data: faithData, isLoading } = trpc.faithProfile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (faithData) {
      setDenomination(faithData.denomination ?? "");
      setFaithLevel((faithData.faithLevel as typeof faithLevel) ?? "");
      setBibleVersion(faithData.bibleVersion ?? "");
      setPrayerFrequency((faithData.prayerFrequency as typeof prayerFrequency) ?? "");
      setChurch(faithData.church ?? "");
    }
  }, [faithData]);

  const utils = trpc.useUtils();
  const updateMutation = trpc.faithProfile.updateFaith.useMutation({
    onSuccess: () => {
      toast.success("Faith profile saved!");
      utils.faithProfile.get.invalidate();
      utils.profile.completionScore.invalidate();
      navigate("/browse?tab=profile");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate({
      denomination: denomination || undefined,
      faithLevel: faithLevel || undefined,
      bibleVersion: bibleVersion || undefined,
      prayerFrequency: prayerFrequency || undefined,
      church: church || undefined,
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
          <h1 className="text-white font-bold text-base leading-tight">My Faith & Values</h1>
          <p className="text-purple-300 text-xs">Faith, church, and what matters most</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Denomination */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Church size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Denomination</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DENOMINATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDenomination(denomination === d ? "" : d)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors text-left ${
                  denomination === d
                    ? "bg-amber-500 border-amber-500 text-black"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Faith Level */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Faith Level</label>
          </div>
          <div className="space-y-2">
            {[
              { value: "growing", label: "Growing", desc: "Still developing my faith journey" },
              { value: "committed", label: "Committed", desc: "Actively living out my faith" },
              { value: "deeply_rooted", label: "Deeply Rooted", desc: "Faith is the foundation of everything" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFaithLevel(opt.value as typeof faithLevel)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                  faithLevel === opt.value
                    ? "bg-amber-500/20 border-amber-500 text-white"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                  faithLevel === opt.value ? "border-amber-400 bg-amber-400" : "border-purple-400"
                }`} />
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-purple-300">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bible Version */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Preferred Bible Version</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {BIBLE_VERSIONS.map((v) => (
              <button
                key={v}
                onClick={() => setBibleVersion(bibleVersion === v ? "" : v)}
                className={`px-4 py-2 rounded-full text-xs font-medium border transition-colors ${
                  bibleVersion === v
                    ? "bg-amber-500 border-amber-500 text-black"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Prayer Frequency */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Prayer Frequency</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "daily", label: "Daily", icon: "🌅" },
              { value: "weekly", label: "Weekly", icon: "📅" },
              { value: "occasionally", label: "Sometimes", icon: "🙏" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPrayerFrequency(opt.value as typeof prayerFrequency)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${
                  prayerFrequency === opt.value
                    ? "bg-amber-500/20 border-amber-500 text-white"
                    : "border-purple-600/40 text-purple-200 bg-white/5"
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Church Name */}
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Church size={16} className="text-amber-400" />
            <label className="text-white font-semibold text-sm">Church Name</label>
          </div>
          <input
            type="text"
            value={church}
            onChange={(e) => setChurch(e.target.value)}
            placeholder="e.g. Bread of Life Church, Lusaka"
            maxLength={256}
            className="w-full bg-white/10 text-white text-sm rounded-xl px-4 py-3 border border-purple-600/40 outline-none placeholder-purple-400 focus:border-amber-400"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || updateMutation.isPending}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-4 rounded-2xl text-base transition-colors"
        >
          {updateMutation.isPending ? "Saving..." : "Save Faith Profile"}
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
}
