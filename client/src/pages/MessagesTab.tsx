import { useState } from "react";
import { Heart, MessageCircle, Eye, Users, Lock, Crown, Phone, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PremiumCheckoutModal from "@/components/PremiumCheckoutModal";
import PaymentModal from "@/components/PaymentModal";

type FilterTab = "all" | "unread" | "unlocked" | "locked" | "chatroom";

export function MessagesTab({ navigate }: { navigate: (path: string) => void }) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showPremium, setShowPremium] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: allConversations, isLoading: loadingConversations } = trpc.home.allConversations.useQuery();
  const { data: actionCounts } = trpc.home.actionCounts.useQuery();
  const { data: chatroomInfo } = trpc.home.chatroomInfo.useQuery();

  if (loadingConversations) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/10 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-white/20 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-white/20 rounded w-1/2 mb-2" />
              <div className="h-2.5 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const conversations = allConversations || [];
  const unlockedConversations = conversations.filter((c) => c.lockState === "unlocked");
  const lockedConversations = conversations.filter((c) => c.lockState !== "unlocked");

  let filtered = conversations;
  if (activeFilter === "unread") {
    filtered = conversations; // TODO: implement unread tracking
  } else if (activeFilter === "unlocked") {
    filtered = unlockedConversations;
  } else if (activeFilter === "locked") {
    filtered = lockedConversations;
  }

  const handleUnlockClick = (userId: number) => {
    setSelectedUserId(userId);
    setShowPayment(true);
  };

  const handleUpgradeClick = () => {
    setShowPremium(true);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900 to-purple-800 px-5 pt-4 pb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white font-bold text-2xl">Messages</h1>
            <p className="text-purple-200 text-sm">Connect, encourage and build lasting connections.</p>
          </div>
          <button
            onClick={() => navigate("/discover")}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 flex items-center gap-2 font-semibold text-sm transition-colors"
          >
            <span>+</span>
            <span>New Message</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all" as FilterTab, label: "All" },
            { id: "unread" as FilterTab, label: "Unread" },
            { id: "unlocked" as FilterTab, label: "Unlocked" },
            { id: "locked" as FilterTab, label: "Locked" },
            { id: "chatroom" as FilterTab, label: "Chatroom" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {tab.label}
              {tab.id === "locked" && lockedConversations.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-yellow-400 text-purple-900 rounded-full text-xs font-bold">
                  {lockedConversations.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-4 pt-3 space-y-3">
        {activeFilter === "chatroom" ? (
          // Chatroom Card
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl p-6 text-white border-2 border-purple-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Faithful Hearts Chatroom</h3>
                  <p className="text-green-300 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    Active now
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm mb-4">
              Join believers in meaningful conversations, prayer and encouragement.
            </p>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/30 border-2 border-white" />
              ))}
              <span className="text-sm font-semibold">+{chatroomInfo?.onlineCount || 0} online</span>
            </div>
            <button
              onClick={() => navigate("/chatroom")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-full transition-colors flex items-center justify-center gap-2"
            >
              <span>Join Chatroom</span>
              <span>›</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-white/50 text-sm">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const isUnlocked = conversation.lockState === "unlocked";
            const lockReason = conversation.lockState === "premium" ? "Premium to chat" : "Unlock to chat";
            return (
              <div
                key={conversation.id}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => {
                  if (isUnlocked) {
                    navigate(`/chat/${conversation.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                      {conversation.photoUrl ? (
                        <img src={conversation.photoUrl} alt={conversation.name || "User"} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-white/50" />
                      )}
                    </div>
                    {!isUnlocked && (
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">
                        {conversation.name || "Member"}
                        {conversation.age && `, ${conversation.age}`}
                      </p>
                    </div>
                    {!isUnlocked && (
                      <p className="text-xs text-yellow-300 mt-1">{lockReason}</p>
                    )}
                    <p className="text-xs text-white/60 truncate mt-1">Last message preview</p>
                    <p className="text-xs text-white/40 mt-1">Recently</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0 flex gap-2">
                    {isUnlocked ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/${conversation.id}`);
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                          <Phone className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chat/${conversation.id}`);
                          }}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                          <Video className="w-5 h-5 text-white" />
                        </button>
                      </>
                    ) : conversation.lockState === "premium" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpgradeClick();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-full text-sm flex items-center gap-2 transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        Upgrade
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockClick(conversation.id);
                        }}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-bold rounded-full text-sm flex items-center gap-2 transition-all"
                      >
                        <span>K20</span>
                        Unlock to chat
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Cards */}
      {activeFilter === "all" && (
        <div className="px-4 pt-6 pb-6 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Heart, label: "New likes", count: actionCounts?.likes || 0 },
              { icon: MessageCircle, label: "Chat requests", count: actionCounts?.requests || 0 },
              { icon: Eye, label: "Profile views", count: actionCounts?.views || 0 },
              { icon: Crown, label: "Go Premium", count: 0, action: handleUpgradeClick },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => item.action?.()}
                className="bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/20 hover:bg-white/15 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <div className="relative">
                  <item.icon className="w-6 h-6 text-white" />
                  {item.count > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {item.count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/70 text-center font-semibold">{item.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showPremium && (
        <PremiumCheckoutModal
          onClose={() => setShowPremium(false)}
          onSuccess={() => {
            setShowPremium(false);
          }}
        />
      )}
      {showPayment && selectedUserId && (
        <PaymentModal
          targetId={selectedUserId}
          targetName={`User ${selectedUserId}`}
          onClose={() => {
            setShowPayment(false);
            setSelectedUserId(null);
          }}
          onSuccess={() => {
            setShowPayment(false);
            setSelectedUserId(null);
            navigate(`/chat/${selectedUserId}`);
          }}
        />
      )}
    </div>
  );
}
