import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Users, DollarSign, MessageSquare, Crown, Megaphone, Heart, RefreshCw, TrendingUp, Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function SuperAdmin() {
  const [, navigate] = useLocation();
  const { data: users, refetch: refetchUsers } = trpc.admin.users.useQuery();
  const { data: payments, refetch: refetchPayments } = trpc.admin.allPayments.useQuery();
  const { data: announcements } = trpc.admin.allAnnouncements.useQuery();
  const { data: stories } = trpc.admin.allLoveStories.useQuery();
  const { data: tickets } = trpc.admin.supportTickets.useQuery();
  const { data: admins } = trpc.admin.allAdmins.useQuery();

  const totalUsers = users?.length ?? 0;
  const premiumUsers = users?.filter(u => u.isPremium).length ?? 0;
  const bannedUsers = users?.filter(u => u.isBanned).length ?? 0;
  const verifiedUsers = users?.filter(u => u.isVerified).length ?? 0;
  const totalRevenue = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const chatUnlocks = (payments ?? []).filter(p => p.amount === 20).length;
  const premiumSubs = (payments ?? []).filter(p => p.amount >= 50).length;
  const openTickets = (tickets ?? []).filter(t => t.status === "open").length;

  const panels = [
    { id: "finance", label: "Finance Admin", icon: <DollarSign className="w-5 h-5" />, color: "#22c55e", route: "/admin/finance" },
    { id: "support", label: "Support Admin", icon: <MessageSquare className="w-5 h-5" />, color: "#3b82f6", route: "/admin/support" },
    { id: "systems", label: "Systems & Settings", icon: <Shield className="w-5 h-5" />, color: "#f97316", route: "/admin/systems" },
    { id: "users", label: "User Management", icon: <Users className="w-5 h-5" />, color: "#8b5cf6", route: "/admin/users" },
    { id: "announcements", label: "Announcement Center", icon: <Megaphone className="w-5 h-5" />, color: "#ef4444", route: "/admin/announcements" },
    { id: "roles", label: "Roles & Credentials", icon: <Crown className="w-5 h-5" />, color: "#6366f1", route: "/admin/roles" },
  ];

  return (
    <AdminShell panelId="super" title="Super Admin" subtitle="Full control across all admin panels">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { refetchUsers(); refetchPayments(); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 border border-white/10 hover:text-white transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh All
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Total Users", value: totalUsers, icon: <Users className="w-4 h-4" />, color: "#8b5cf6" },
          { label: "Premium Members", value: premiumUsers, icon: <Crown className="w-4 h-4" />, color: "#f59e0b" },
          { label: "Total Revenue (K)", value: totalRevenue, icon: <DollarSign className="w-4 h-4" />, color: "#22c55e" },
          { label: "Chat Unlocks", value: chatUnlocks, icon: <MessageSquare className="w-4 h-4" />, color: "#3b82f6" },
          { label: "Premium Subs", value: premiumSubs, icon: <TrendingUp className="w-4 h-4" />, color: "#ec4899" },
          { label: "Open Tickets", value: openTickets, icon: <MessageSquare className="w-4 h-4" />, color: "#ef4444" },
          { label: "Announcements", value: announcements?.length ?? 0, icon: <Megaphone className="w-4 h-4" />, color: "#f97316" },
          { label: "Love Stories", value: stories?.length ?? 0, icon: <Heart className="w-4 h-4" />, color: "#e11d48" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-white/50 text-xs">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick stats bar */}
      <div className="rounded-xl border border-white/10 p-4 mb-6" style={{ background: "rgba(255,255,255,0.03)" }}>
        <h3 className="text-white font-semibold text-sm mb-3">User Breakdown</h3>
        <div className="flex gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span><span className="text-white/60">Verified: <span className="text-white font-medium">{verifiedUsers}</span></span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-white/60">Premium: <span className="text-white font-medium">{premiumUsers}</span></span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span><span className="text-white/60">Banned: <span className="text-white font-medium">{bannedUsers}</span></span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400"></span><span className="text-white/60">Admins: <span className="text-white font-medium">{admins?.length ?? 0}</span></span></div>
        </div>
      </div>

      {/* Panel shortcuts */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">Quick Access to All Panels</h3>
        </div>
        <div className="divide-y divide-white/5">
          {panels.map(panel => (
            <button
              key={panel.id}
              onClick={() => navigate(panel.route)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${panel.color}20`, color: panel.color }}>
                {panel.icon}
              </div>
              <span className="text-white text-sm font-medium flex-1">{panel.label}</span>
              <span className="text-white/30 text-xs">→</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent payments */}
      {(payments ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Recent Payments</h3>
          </div>
          <div className="divide-y divide-white/5">
            {(payments ?? []).slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm capitalize">{p.provider ?? "Payment"}</div>
                  <div className="text-white/40 text-xs">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="text-green-400 font-semibold text-sm">K{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
