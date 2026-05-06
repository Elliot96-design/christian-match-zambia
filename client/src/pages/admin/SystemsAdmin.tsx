import { useState, useEffect, type JSX } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Save, RefreshCw, BookOpen, Home, Navigation, Info } from "lucide-react";
import { toast } from "sonner";

export default function SystemsAdmin() {
  const [activeSection, setActiveSection] = useState<"welcome" | "home" | "navigation" | "bible">("welcome");

  const { data: settings, isLoading, refetch } = trpc.admin.appSettings.useQuery();
  const updateMutation = trpc.admin.updateSetting.useMutation({
    onSuccess: () => { toast.success("Setting saved"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // Local form state
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("");
  const [welcomeTagline, setWelcomeTagline] = useState("");
  const [homeGreeting, setHomeGreeting] = useState("");
  const [homeSubGreeting, setHomeSubGreeting] = useState("");
  const [bibleVerse, setBibleVerse] = useState("");
  const [bibleRef, setBibleRef] = useState("");
  const [navHome, setNavHome] = useState("");
  const [navDiscover, setNavDiscover] = useState("");
  const [navChatroom, setNavChatroom] = useState("");
  const [navMessages, setNavMessages] = useState("");
  const [navProfile, setNavProfile] = useState("");

  useEffect(() => {
    if (!settings) return;
    const get = (key: string, def: string) => settings.find(s => s.settingKey === key)?.settingValue ?? def;
    setWelcomeTitle(get("welcome_title", "Faithful Hearts"));
    setWelcomeSubtitle(get("welcome_subtitle", "FAITH. LOVE. PURPOSE."));
    setWelcomeTagline(get("welcome_tagline", "Find godly connections that lead to purpose and love."));
    setHomeGreeting(get("home_greeting", "Good morning,"));
    setHomeSubGreeting(get("home_sub_greeting", "Let your faith guide your heart."));
    setBibleVerse(get("bible_verse_text", "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to Him, and He will make your paths straight."));
    setBibleRef(get("bible_verse_ref", "Proverbs 3:5-6 (NIV)"));
    setNavHome(get("nav_home", "Home"));
    setNavDiscover(get("nav_discover", "Discover"));
    setNavChatroom(get("nav_chatroom", "Chatroom"));
    setNavMessages(get("nav_messages", "Messages"));
    setNavProfile(get("nav_profile", "Profile"));
  }, [settings]);

  const save = (key: string, value: string) => updateMutation.mutate({ key, value });

  const sections = [
    { id: "welcome" as const, label: "Welcome Screen", icon: <Info className="w-4 h-4" /> },
    { id: "home" as const, label: "Home Screen", icon: <Home className="w-4 h-4" /> },
    { id: "navigation" as const, label: "Bottom Navigation", icon: <Navigation className="w-4 h-4" /> },
    { id: "bible" as const, label: "Daily Bible Verse", icon: <BookOpen className="w-4 h-4" /> },
  ];

  const FieldRow = ({ label, value, onChange, onSave, multiline = false }: {
    label: string; value: string; onChange: (v: string) => void; onSave: () => void; multiline?: boolean;
  }): JSX.Element => (
    <div className="mb-4">
      <label className="text-white/60 text-xs font-medium block mb-1.5">{label}</label>
      <div className="flex gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none resize-none focus:border-orange-500/50"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-orange-500/50"
          />
        )}
        <button
          onClick={onSave}
          disabled={updateMutation.isPending}
          className="px-3 py-2 rounded-lg bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-60 flex-shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );

  return (
    <AdminShell panelId="systems" title="Systems & Settings" subtitle="Edit text and labels across the app">
      {/* Section tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === s.id
                ? "bg-orange-600 text-white"
                : "text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
        <button
          onClick={() => refetch()}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="text-white/40 text-sm text-center py-8">Loading settings...</div>
      ) : (
        <div className="rounded-xl border border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
          {activeSection === "welcome" && (
            <>
              <h3 className="text-white font-semibold text-sm mb-4">Welcome Screen Text</h3>
              <FieldRow label="App Title" value={welcomeTitle} onChange={setWelcomeTitle} onSave={() => save("welcome_title", welcomeTitle)} />
              <FieldRow label="Subtitle (tagline under logo)" value={welcomeSubtitle} onChange={setWelcomeSubtitle} onSave={() => save("welcome_subtitle", welcomeSubtitle)} />
              <FieldRow label="Discover tagline" value={welcomeTagline} onChange={setWelcomeTagline} onSave={() => save("welcome_tagline", welcomeTagline)} multiline />
            </>
          )}

          {activeSection === "home" && (
            <>
              <h3 className="text-white font-semibold text-sm mb-4">Home Screen Text</h3>
              <FieldRow label="Greeting prefix (e.g. Good morning,)" value={homeGreeting} onChange={setHomeGreeting} onSave={() => save("home_greeting", homeGreeting)} />
              <FieldRow label="Sub-greeting (below username)" value={homeSubGreeting} onChange={setHomeSubGreeting} onSave={() => save("home_sub_greeting", homeSubGreeting)} />
            </>
          )}

          {activeSection === "navigation" && (
            <>
              <h3 className="text-white font-semibold text-sm mb-4">Bottom Navigation Labels</h3>
              <FieldRow label="Home tab label" value={navHome} onChange={setNavHome} onSave={() => save("nav_home", navHome)} />
              <FieldRow label="Discover tab label" value={navDiscover} onChange={setNavDiscover} onSave={() => save("nav_discover", navDiscover)} />
              <FieldRow label="Chatroom tab label" value={navChatroom} onChange={setNavChatroom} onSave={() => save("nav_chatroom", navChatroom)} />
              <FieldRow label="Messages tab label" value={navMessages} onChange={setNavMessages} onSave={() => save("nav_messages", navMessages)} />
              <FieldRow label="Profile tab label" value={navProfile} onChange={setNavProfile} onSave={() => save("nav_profile", navProfile)} />
            </>
          )}

          {activeSection === "bible" && (
            <>
              <h3 className="text-white font-semibold text-sm mb-4">Daily Bible Verse</h3>
              <FieldRow label="Verse text" value={bibleVerse} onChange={setBibleVerse} onSave={() => save("bible_verse_text", bibleVerse)} multiline />
              <FieldRow label="Reference (e.g. Proverbs 3:5-6 NIV)" value={bibleRef} onChange={setBibleRef} onSave={() => save("bible_verse_ref", bibleRef)} />
              <p className="text-white/30 text-xs mt-2">Changes will appear on the Home screen immediately after saving.</p>
            </>
          )}
        </div>
      )}
    </AdminShell>
  );
}
