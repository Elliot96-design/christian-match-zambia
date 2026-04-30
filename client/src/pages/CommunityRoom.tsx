import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  MessageCircle,
  Heart,
  BookOpen,
  Users,
  Search,
  MoreVertical,
  Send,
  Plus,
  Pin,
  ChevronRight,
  Shield,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { NavTab } from "@/components/BottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "general" | "counseling" | "testimonies" | "bible_verse" | "prayer_requests" | "prayer_sessions";
type MessageType = "general" | "bible_verse" | "testimony" | "prayer_request" | "counseling";

interface ChatroomMsg {
  id: number;
  userId: number;
  content: string;
  messageType: MessageType;
  category: Category;
  createdAt: Date;
  userName: string | null;
  userPhotoUrl: string | null;
  userIsPremium: boolean;
  reactions: { id: number; messageId: number; userId: number; reactionType: "heart" | "pray"; createdAt: Date }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES: { key: Category; label: string; icon: React.ReactNode }[] = [
  { key: "counseling", label: "Counseling", icon: <MessageCircle size={13} /> },
  { key: "testimonies", label: "Testimonies", icon: <Heart size={13} /> },
  { key: "bible_verse", label: "Bible Verse", icon: <BookOpen size={13} /> },
  { key: "prayer_requests", label: "Prayer Requests", icon: <span className="text-xs">🙏</span> },
  { key: "prayer_sessions", label: "Prayer Sessions", icon: <Users size={13} /> },
];

const TYPE_LABELS: Record<MessageType, { label: string; color: string; icon: string }> = {
  general: { label: "", color: "", icon: "" },
  bible_verse: { label: "Bible Verse", color: "text-purple-400", icon: "📖" },
  testimony: { label: "Testimony", color: "text-amber-400", icon: "🙌" },
  prayer_request: { label: "Prayer Request", color: "text-blue-400", icon: "🙏" },
  counseling: { label: "Counseling", color: "text-green-400", icon: "💬" },
};

const PINNED_MESSAGE = "Weekly Prayer Focus: Pray for wisdom in all decisions this week.";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Post Message Modal ───────────────────────────────────────────────────────

function PostModal({
  onClose,
  onPost,
  category,
}: {
  onClose: () => void;
  onPost: (content: string, type: MessageType, cat: Category) => void;
  category: Category;
}) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<MessageType>("general");
  const [cat, setCat] = useState<Category>(category === "general" ? "general" : category);

  const typeOptions: { value: MessageType; label: string }[] = [
    { value: "general", label: "General" },
    { value: "bible_verse", label: "Bible Verse" },
    { value: "testimony", label: "Testimony" },
    { value: "prayer_request", label: "Prayer Request" },
    { value: "counseling", label: "Counseling" },
  ];

  const catOptions: { value: Category; label: string }[] = [
    { value: "general", label: "General" },
    { value: "counseling", label: "Counseling" },
    { value: "testimonies", label: "Testimonies" },
    { value: "bible_verse", label: "Bible Verse" },
    { value: "prayer_requests", label: "Prayer Requests" },
    { value: "prayer_sessions", label: "Prayer Sessions" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#1a0a3e] rounded-t-2xl p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">New Message</h3>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                type === opt.value
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-purple-700 text-purple-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as Category)}
          className="w-full bg-[#2a1060] text-white text-sm rounded-lg px-3 py-2 mb-3 border border-purple-700 outline-none"
        >
          {catOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share a message, verse, testimony, or prayer request..."
          rows={4}
          maxLength={1000}
          className="w-full bg-[#2a1060] text-white text-sm rounded-lg px-3 py-2 mb-3 border border-purple-700 outline-none resize-none placeholder-purple-400"
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-purple-400">{content.length}/1000</span>
          <button
            disabled={content.trim().length === 0}
            onClick={() => {
              if (content.trim()) {
                onPost(content.trim(), type, cat);
                onClose();
              }
            }}
            className="bg-purple-600 disabled:opacity-40 text-white px-5 py-2 rounded-full text-sm font-semibold"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({
  msg,
  currentUserId,
  onReact,
}: {
  msg: ChatroomMsg;
  currentUserId: number;
  onReact: (messageId: number, type: "heart" | "pray") => void;
}) {
  const typeInfo = TYPE_LABELS[msg.messageType];
  const heartCount = msg.reactions.filter((r) => r.reactionType === "heart").length;
  const prayCount = msg.reactions.filter((r) => r.reactionType === "pray").length;
  const hasHearted = msg.reactions.some((r) => r.reactionType === "heart" && r.userId === currentUserId);
  const hasPrayed = msg.reactions.some((r) => r.reactionType === "pray" && r.userId === currentUserId);

  return (
    <div className="flex gap-3 mb-4">
      {/* Avatar */}
      <div className="flex-shrink-0 relative">
        {msg.userPhotoUrl ? (
          <img
            src={msg.userPhotoUrl}
            alt={msg.userName ?? "User"}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(msg.userName)}
          </div>
        )}
        {msg.userIsPremium && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-[8px]">👑</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-amber-400 font-semibold text-sm">{msg.userName ?? "Member"}</span>
          <span className="text-gray-500 text-xs">{formatTime(msg.createdAt)}</span>
        </div>

        <div className="bg-[#1e0d40] rounded-2xl rounded-tl-none px-4 py-3">
          {/* Type badge */}
          {typeInfo.label && (
            <div className={`flex items-center gap-1 text-xs font-semibold mb-2 ${typeInfo.color}`}>
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.label}</span>
            </div>
          )}
          <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-3 mt-2 ml-1">
          <button
            onClick={() => onReact(msg.id, "heart")}
            className={`flex items-center gap-1 text-xs transition-colors ${
              hasHearted ? "text-red-400" : "text-gray-500 hover:text-red-400"
            }`}
          >
            <span>❤️</span>
            <span>{heartCount}</span>
          </button>
          <button
            onClick={() => onReact(msg.id, "pray")}
            className={`flex items-center gap-1 text-xs transition-colors ${
              hasPrayed ? "text-amber-400" : "text-gray-500 hover:text-amber-400"
            }`}
          >
            <span>🙏</span>
            <span>{prayCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Chatroom Page ───────────────────────────────────────────────────────

export default function ChatroomPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [quickMessage, setQuickMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatroomMsg[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login");
  }, [loading, isAuthenticated, navigate]);

  // Fetch messages with polling
  const { data: messagesData, isLoading: messagesLoading } = trpc.chatroom.messages.useQuery(
    { category: activeCategory },
    { refetchInterval: 3000, enabled: isAuthenticated }
  );

  // Online count
  const { data: onlineData } = trpc.chatroom.onlineCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: isAuthenticated,
  });

  // Sync server messages to local state
  useEffect(() => {
    if (messagesData) {
      setLocalMessages(messagesData as ChatroomMsg[]);
    }
  }, [messagesData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length]);

  const postMutation = trpc.chatroom.post.useMutation({
    onSuccess: () => {
      utils.chatroom.messages.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reactMutation = trpc.chatroom.react.useMutation({
    onMutate: ({ messageId, reactionType }) => {
      // Optimistic update
      setLocalMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const existing = msg.reactions.find(
            (r) => r.reactionType === reactionType && r.userId === (user?.id ?? 0)
          );
          if (existing) {
            return { ...msg, reactions: msg.reactions.filter((r) => r.id !== existing.id) };
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                { id: Date.now(), messageId, userId: user?.id ?? 0, reactionType, createdAt: new Date() },
              ],
            };
          }
        })
      );
    },
    onError: () => utils.chatroom.messages.invalidate(),
  });

  const handlePost = (content: string, type: MessageType, cat: Category) => {
    postMutation.mutate({ content, messageType: type, category: cat });
  };

  const handleQuickSend = () => {
    if (!quickMessage.trim()) return;
    postMutation.mutate({
      content: quickMessage.trim(),
      messageType: "general",
      category: activeCategory ?? "general",
    });
    setQuickMessage("");
  };

  const handleReact = (messageId: number, type: "heart" | "pray") => {
    reactMutation.mutate({ messageId, reactionType: type });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0520] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0520] flex flex-col max-w-md mx-auto relative">
      {/* Header */}
      <div className="bg-[#0d0520] px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-white text-2xl font-bold">Chatroom</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-400 text-xs">{onlineData ?? 0} people online</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Search size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategory === cat.key
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-purple-700/50 text-gray-300 bg-[#1a0a3e]/50"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Welcome banner */}
      <div className="mx-4 mb-3 flex-shrink-0">
        <div className="bg-[#1a0a3e] border border-purple-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Welcome to our safe space 💜</p>
            <p className="text-gray-400 text-xs mt-0.5">Encourage, uplift and support one another in Christ.</p>
          </div>
          <button className="flex-shrink-0 bg-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            Learn More
          </button>
        </div>
      </div>

      {/* Pinned message */}
      <div className="mx-4 mb-3 flex-shrink-0">
        <div className="bg-[#1a0a3e]/60 border border-purple-700/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Pin size={14} className="text-amber-400 flex-shrink-0" />
          <p className="text-gray-300 text-xs flex-1 min-w-0 truncate">
            <span className="text-amber-400 font-semibold">Pinned: </span>
            {PINNED_MESSAGE}
          </p>
          <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {messagesLoading && localMessages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-purple-900/40 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-purple-400" />
            </div>
            <p className="text-gray-300 font-semibold mb-1">No messages yet</p>
            <p className="text-gray-500 text-sm">Be the first to share a message, verse, or prayer!</p>
          </div>
        ) : (
          <>
            {localMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                msg={msg}
                currentUserId={user?.id ?? 0}
                onReact={handleReact}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div className="bg-[#0d0520] border-t border-purple-900/40 px-3 py-3 flex-shrink-0 pb-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPostModal(true)}
            className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Plus size={18} className="text-white" />
          </button>
          <input
            type="text"
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickSend()}
            placeholder="Type a message..."
            className="flex-1 bg-[#1a0a3e] text-white text-sm rounded-full px-4 py-2.5 border border-purple-700/40 outline-none placeholder-gray-500 min-w-0"
          />
          <button
            onClick={handleQuickSend}
            disabled={!quickMessage.trim() || postMutation.isPending}
            className="w-9 h-9 bg-purple-600 disabled:opacity-40 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Post modal */}
      {showPostModal && (
        <PostModal
          onClose={() => setShowPostModal(false)}
          onPost={handlePost}
          category={activeCategory ?? "general"}
        />
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40">
        <BottomNav active={"chatroom" as NavTab} onTabChange={() => {}} />
      </div>
    </div>
  );
}
