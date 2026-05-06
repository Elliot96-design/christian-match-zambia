import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Heart, RefreshCw, Megaphone, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AnnouncementsAdmin() {
  const [activeTab, setActiveTab] = useState<"announcements" | "stories">("announcements");

  // Announcements
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Love Stories
  const [storyCouple, setStoryCouple] = useState("");
  const [storyLocation, setStoryLocation] = useState("");
  const [storyQuote, setStoryQuote] = useState("");
  const [storyText, setStoryText] = useState("");
  const [storyPhoto, setStoryPhoto] = useState("");

  const { data: announcements, isLoading: annLoading, refetch: refetchAnn } = trpc.admin.allAnnouncements.useQuery();
  const { data: stories, isLoading: storiesLoading, refetch: refetchStories } = trpc.admin.allLoveStories.useQuery();

  const createAnnMutation = trpc.admin.createAnnouncement.useMutation({
    onSuccess: () => {
      toast.success("Announcement posted");
      setAnnTitle(""); setAnnContent("");
      refetchAnn();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteAnnMutation = trpc.admin.deleteAnnouncement.useMutation({
    onSuccess: () => { toast.success("Announcement deleted"); refetchAnn(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const createStoryMutation = trpc.admin.createLoveStory.useMutation({
    onSuccess: () => {
      toast.success("Love story added");
      setStoryCouple(""); setStoryLocation(""); setStoryQuote(""); setStoryText(""); setStoryPhoto("");
      refetchStories();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const deleteStoryMutation = trpc.admin.deleteLoveStory.useMutation({
    onSuccess: () => { toast.success("Love story deleted"); refetchStories(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handlePostAnnouncement = () => {
    if (!annTitle.trim()) { toast.error("Title required"); return; }
    if (!annContent.trim()) { toast.error("Content required"); return; }
    createAnnMutation.mutate({ title: annTitle, content: annContent });
  };

  const handleAddStory = () => {
    if (!storyCouple.trim()) { toast.error("Couple name required"); return; }
    if (!storyLocation.trim()) { toast.error("Location required"); return; }
    if (!storyQuote.trim()) { toast.error("Quote required"); return; }
    if (!storyText.trim()) { toast.error("Story text required"); return; }
    createStoryMutation.mutate({ coupleName: storyCouple, location: storyLocation, quoteTitle: storyQuote, story: storyText, photoUrl: storyPhoto || undefined });
  };

  return (
    <AdminShell panelId="announcements" title="Announcement Center" subtitle="Post announcements and manage love stories">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "announcements" as const, label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
          { id: "stories" as const, label: "Love Stories", icon: <Heart className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-red-600 text-white" : "text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => { refetchAnn(); refetchStories(); }}
          className="ml-auto px-3 py-2 rounded-lg text-white/60 border border-white/10 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Announcements tab */}
      {activeTab === "announcements" && (
        <div className="space-y-4">
          {/* Create form */}
          <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-400" />
              Post New Announcement
            </h3>
            <input
              type="text"
              placeholder="Announcement title..."
              value={annTitle}
              onChange={e => setAnnTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50 mb-3"
            />
            <textarea
              placeholder="Announcement content..."
              value={annContent}
              onChange={e => setAnnContent(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50 resize-none mb-3"
            />
            <button
              onClick={handlePostAnnouncement}
              disabled={createAnnMutation.isPending}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-red-700 transition-colors"
            >
              {createAnnMutation.isPending ? "Posting..." : "Post Announcement"}
            </button>
          </div>

          {/* List */}
          {annLoading ? (
            <div className="text-white/40 text-sm text-center py-4">Loading...</div>
          ) : !announcements?.length ? (
            <div className="text-white/40 text-sm text-center py-4">No announcements yet.</div>
          ) : (
            announcements.map((ann: { id: number; title: string; content: string; createdAt: Date }) => (
              <div key={ann.id} className="rounded-xl border border-white/10 p-4 flex gap-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Megaphone className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm mb-0.5">{ann.title}</div>
                  <p className="text-white/60 text-xs line-clamp-2">{ann.content}</p>
                  <div className="text-white/30 text-[10px] mt-1">{new Date(ann.createdAt).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => deleteAnnMutation.mutate({ id: ann.id })}
                  className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Love Stories tab */}
      {activeTab === "stories" && (
        <div className="space-y-4">
          {/* Create form */}
          <div className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-400" />
              Add Love Story
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="text" placeholder="Couple name (e.g. Tendai & Wezi)" value={storyCouple} onChange={e => setStoryCouple(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50" />
              <input type="text" placeholder="Location (e.g. Harare, Zimbabwe)" value={storyLocation} onChange={e => setStoryLocation(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50" />
            </div>
            <input type="text" placeholder="Quote title (e.g. Faith brought us together...)" value={storyQuote} onChange={e => setStoryQuote(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50 mb-3" />
            <textarea placeholder="Full story text..." value={storyText} onChange={e => setStoryText(e.target.value)} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50 resize-none mb-3" />
            <input type="text" placeholder="Photo URL (optional)" value={storyPhoto} onChange={e => setStoryPhoto(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-red-500/50 mb-3" />
            <button
              onClick={handleAddStory}
              disabled={createStoryMutation.isPending}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-red-700 transition-colors"
            >
              {createStoryMutation.isPending ? "Adding..." : "Add Love Story"}
            </button>
          </div>

          {/* List */}
          {storiesLoading ? (
            <div className="text-white/40 text-sm text-center py-4">Loading...</div>
          ) : !stories?.length ? (
            <div className="text-white/40 text-sm text-center py-4">No love stories yet.</div>
          ) : (
            stories.map((story) => (
              <div key={story.id} className="rounded-xl border border-white/10 p-4 flex gap-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Heart className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm mb-0.5">{story.coupleName}</div>
                  <div className="text-white/40 text-xs mb-1">{story.location}</div>
                  <p className="text-white/60 text-xs line-clamp-2 italic">"{story.quoteTitle}"</p>
                </div>
                <button
                  onClick={() => deleteStoryMutation.mutate({ id: story.id })}
                  className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </AdminShell>
  );
}
