import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Lock, Send, User } from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const targetId = parseInt(id ?? "0");
  const { user: me, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: target } = trpc.profile.get.useQuery(
    { userId: targetId },
    { enabled: !!isAuthenticated && !!targetId }
  );

  const { data: unlockStatus } = trpc.chat.checkUnlock.useQuery(
    { targetId },
    { enabled: !!isAuthenticated && !!targetId }
  );

  const { data: messages, isLoading } = trpc.chat.messages.useQuery(
    { targetId },
    {
      enabled: !!isAuthenticated && !!targetId && (unlockStatus?.unlocked ?? false),
      refetchInterval: 3000, // Poll every 3 seconds for real-time feel
    }
  );

  const sendMsg = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.messages.invalidate({ targetId });
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to send message");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isAuthenticated) { navigate("/"); return null; }

  const handleSend = async () => {
    const content = message.trim();
    if (!content) return;
    setMessage("");
    await sendMsg.mutateAsync({ targetId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(`/profile/${targetId}`)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-muted"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="w-9 h-9 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center flex-shrink-0">
          {target?.photoUrl ? (
            <img src={target.photoUrl} alt={target.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{target?.name ?? "Loading..."}</p>
          <p className="text-xs text-muted-foreground">{target?.church ?? ""}</p>
        </div>
        {/* Logo right */}
        <img src={LOGO_URL} alt="" className="w-8 h-8 rounded-lg object-cover opacity-80 flex-shrink-0" />
      </header>

      {/* Chat area */}
      {!unlockStatus?.unlocked ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <p className="font-semibold text-foreground">Chat Locked</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
              This chat is not unlocked. Go back to the profile and pay K10 to unlock.
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => navigate(`/profile/${targetId}`)}
            >
              Go to Profile
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Chat unlocked! Say hello to {target?.name?.split(" ")[0] ?? "them"} 👋
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === me?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-primary text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="leading-relaxed break-words">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? "text-white/70" : "text-muted-foreground"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 h-11 rounded-xl text-base"
              maxLength={1000}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMsg.isPending}
              className="w-11 h-11 rounded-xl p-0 flex-shrink-0"
            >
              {sendMsg.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
