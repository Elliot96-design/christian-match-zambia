import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { MessageSquare, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type TicketStatus = "in_progress" | "resolved" | "closed";

export default function SupportAdmin() {
  const [activeTab, setActiveTab] = useState<"tickets" | "chatroom">("tickets");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyStatus, setReplyStatus] = useState<TicketStatus>("resolved");

  const { data: tickets, isLoading: ticketsLoading, refetch: refetchTickets } = trpc.admin.supportTickets.useQuery();
  const { data: chatMessages, isLoading: chatLoading, refetch: refetchChat } = trpc.admin.chatroomMessages.useQuery();

  const resolveTicketMutation = trpc.admin.resolveTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      setSelectedTicket(null);
      setReplyText("");
      refetchTickets();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteChatMutation = trpc.admin.deleteChatroomMessage.useMutation({
    onSuccess: () => { toast.success("Message deleted"); refetchChat(); },
    onError: (e) => toast.error(e.message),
  });

  const banUserMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => toast.success("User ban status updated"),
    onError: (e) => toast.error(e.message),
  });

  const statusIcon = (s: string) => {
    if (s === "open") return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
    if (s === "in_progress") return <Clock className="w-3.5 h-3.5 text-yellow-400" />;
    return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  };

  const statusColor = (s: string) => {
    if (s === "open") return "#ef4444";
    if (s === "in_progress") return "#f59e0b";
    return "#10b981";
  };

  const openCount = tickets?.filter(t => t.status === "open").length ?? 0;

  return (
    <AdminShell panelId="support" title="Support Admin" subtitle="User reports, tickets & chatroom moderation">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "tickets" as const, label: `Support Tickets${openCount > 0 ? ` (${openCount} open)` : ""}` },
          { id: "chatroom" as const, label: "Chatroom Moderation" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-white/60 hover:text-white border border-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => { refetchTickets(); refetchChat(); }}
          className="ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 border border-white/10 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Support Tickets tab */}
      {activeTab === "tickets" && (
        <div className="space-y-3">
          {ticketsLoading ? (
            <div className="text-white/40 text-sm text-center py-8">Loading tickets...</div>
          ) : !tickets?.length ? (
            <div className="text-white/40 text-sm text-center py-8">No support tickets yet.</div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                className="rounded-xl border border-white/10 p-4 cursor-pointer hover:border-white/20 transition-colors"
                style={{ background: "rgba(255,255,255,0.03)" }}
                onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(ticket.status)}
                      <span className="text-white font-medium text-sm truncate">{ticket.subject}</span>
                    </div>
                    <div className="text-white/40 text-xs">
                      From: {ticket.userName ?? "Unknown"} · {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    <p className="text-white/60 text-xs mt-2 line-clamp-2">{ticket.message}</p>
                    {ticket.adminReply && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-blue-300 text-xs">Reply: {ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                    style={{ background: `${statusColor(ticket.status)}22`, color: statusColor(ticket.status) }}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                </div>

                {/* Reply form */}
                {selectedTicket === ticket.id && ticket.status !== "closed" && (
                  <div className="mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
                    <textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write your reply..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none resize-none focus:border-blue-500/50"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <select
                        value={replyStatus}
                        onChange={e => setReplyStatus(e.target.value as TicketStatus)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none"
                      >
                        <option value="in_progress">Mark In Progress</option>
                        <option value="resolved">Mark Resolved</option>
                        <option value="closed">Close Ticket</option>
                      </select>
                      <button
                        onClick={() => {
                          if (!replyText.trim()) { toast.error("Please write a reply"); return; }
                          resolveTicketMutation.mutate({ ticketId: ticket.id, reply: replyText, status: replyStatus });
                        }}
                        disabled={resolveTicketMutation.isPending}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        {resolveTicketMutation.isPending ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        onClick={() => banUserMutation.mutate({ userId: ticket.userId, ban: true })}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        Ban User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Chatroom Moderation tab */}
      {activeTab === "chatroom" && (
        <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold text-sm">Chatroom Messages</h3>
            <span className="text-white/40 text-xs">{chatMessages?.length ?? 0} messages</span>
          </div>
          {chatLoading ? (
            <div className="p-8 text-center text-white/40 text-sm">Loading messages...</div>
          ) : !chatMessages?.length ? (
            <div className="p-8 text-center text-white/40 text-sm">No chatroom messages yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {chatMessages.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                  <MessageSquare className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white/80 text-xs font-medium">{msg.userName ?? "Unknown"}</span>
                      <span className="text-white/30 text-[10px]">{new Date(msg.createdAt).toLocaleString()}</span>
                      {msg.messageType !== "general" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300">
                          {msg.messageType}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs line-clamp-2">{msg.content}</p>
                  </div>
                  <button
                    onClick={() => deleteChatMutation.mutate({ messageId: msg.id })}
                    className="text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
