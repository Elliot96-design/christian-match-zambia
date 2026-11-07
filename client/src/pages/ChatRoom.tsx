import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import { ArrowLeft, Camera, Lock, Mic, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { CHAT_UNLOCK_ZMW, formatPrice } from "@/lib/pricing";

export default function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const targetId = parseInt(id ?? "0");
  const { user: me, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
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
      refetchInterval: 3000,
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
  const sendAttachment = trpc.chat.sendAttachment.useMutation({
    onSuccess: () => utils.chat.messages.invalidate({ targetId }),
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

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

  const fileToBase64 = (file: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5MB"); return; }
    await sendAttachment.mutateAsync({ targetId, attachmentType: "photo", base64: await fileToBase64(file), mimeType: file.type });
  };

  const toggleVoice = async () => {
    if (!me?.isPremium) { toast.error("Voice notes are available to premium members only."); return; }
    if (isRecording && recorderRef.current) { recorderRef.current.stop(); return; }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await sendAttachment.mutateAsync({ targetId, attachmentType: "voice", base64: await fileToBase64(blob), mimeType: "audio/webm" });
    };
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const renderMessage = (content: string) => {
    try {
      const attachment = JSON.parse(content) as { kind?: string; url?: string };
      if (attachment.kind === "photo" && attachment.url) return <img src={attachment.url} alt="Shared photo" className="max-w-full rounded-xl" />;
      if (attachment.kind === "voice" && attachment.url) return <audio controls src={attachment.url} className="max-w-full" />;
    } catch { /* ordinary text message */ }
    return <p>{content}</p>;
  };

  return (
      <div className="h-screen bg-background flex flex-col max-w-[480px] mx-auto overflow-hidden">
      {/* Header */}
      <header className="hero-gradient px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate(`/profile/${targetId}`)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
          {target?.photoUrl ? (
            <img src={target.photoUrl} alt={target.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{target?.name ?? "Loading..."}</p>
          <p className="text-white/60 text-xs">{target?.church ?? ""}</p>
        </div>
        <img src={LOGO_URL} alt="" className="w-8 h-8 rounded-lg object-cover opacity-80 flex-shrink-0" />
      </header>

      {/* Chat area */}
      {!unlockStatus?.unlocked ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <p className="font-display font-bold text-foreground text-lg">Chat Locked</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
              This chat is not unlocked. Go back to the profile and pay {formatPrice(CHAT_UNLOCK_ZMW, me?.location)} to unlock.
            </p>
            <Button
              className="mt-5 btn-purple px-8 h-12"
              onClick={() => navigate(`/profile/${targetId}`)}
            >
              View Profile
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-primary">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <p className="font-semibold text-foreground">Chat unlocked!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Say hello to {target?.name?.split(" ")[0] ?? "them"} 👋
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === me?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "text-white rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                      style={isMine ? { background: "oklch(0.28 0.20 290)" } : {}}
                    >
                      {renderMessage(msg.content)}
                      <p className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}>
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
          <div className="border-t border-border px-4 py-3 flex items-center gap-2 bg-white flex-shrink-0">
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button onClick={() => photoRef.current?.click()} disabled={sendAttachment.isPending} className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-primary disabled:opacity-40" aria-label="Share photo">
              <Camera className="w-4 h-4" />
            </button>
            <button onClick={toggleVoice} disabled={sendAttachment.isPending} className={`w-10 h-10 rounded-full flex items-center justify-center ${isRecording ? "bg-red-500 text-white" : "bg-secondary text-primary"} disabled:opacity-40`} aria-label="Record voice note">
              <Mic className="w-4 h-4" />
            </button>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${target?.name?.split(" ")[0] ?? ""}...`}
              className="flex-1 h-11 rounded-2xl border-border bg-secondary text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sendMsg.isPending}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: "oklch(0.28 0.20 290)" }}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
