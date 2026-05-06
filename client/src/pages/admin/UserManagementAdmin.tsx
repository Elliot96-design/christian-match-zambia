import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Search, Ban, CheckCircle, Shield, RefreshCw, Crown } from "lucide-react";
import { toast } from "sonner";

export default function UserManagementAdmin() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "premium" | "banned" | "verified">("all");

  const { data: users, isLoading, refetch } = trpc.admin.users.useQuery();

  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => { toast.success("User ban status updated"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const verifyMutation = trpc.admin.verifyUser.useMutation({
    onSuccess: () => { toast.success("User verification updated"); refetch(); },
    onError: (e: { message: string }) => toast.error(e.message),
  });



  const filtered = (users ?? []).filter(u => {
    const matchesSearch = !search || (u.name ?? "").toLowerCase().includes(search.toLowerCase()) || (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "premium") return u.isPremium;
    if (filter === "banned") return u.isBanned;
    if (filter === "verified") return u.isVerified;
    return true;
  });

  const totalUsers = users?.length ?? 0;
  const premiumCount = users?.filter(u => u.isPremium).length ?? 0;
  const bannedCount = users?.filter(u => u.isBanned).length ?? 0;
  const verifiedCount = users?.filter(u => u.isVerified).length ?? 0;

  return (
    <AdminShell panelId="users" title="User Management" subtitle="View, verify, ban and manage all users">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Users", value: totalUsers, color: "#7c3aed" },
          { label: "Premium", value: premiumCount, color: "#f59e0b" },
          { label: "Verified", value: verifiedCount, color: "#10b981" },
          { label: "Banned", value: bannedCount, color: "#ef4444" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3 border border-white/10 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "premium", "verified", "banned"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-purple-600 text-white" : "text-white/60 border border-white/10 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="px-3 py-2 rounded-lg text-white/60 border border-white/10 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Users ({filtered.length})</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading users...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No users found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(user => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "rgba(139,92,246,0.2)" }}>
                  {(user as { profilePhoto?: string }).profilePhoto ? (
                    <img src={(user as { profilePhoto?: string }).profilePhoto} alt={user.name ?? ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-purple-300 text-sm font-bold">{(user.name ?? "?")[0].toUpperCase()}</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-white text-sm font-medium truncate">{user.name ?? "Unknown"}</span>
                    {user.isPremium && <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                    {user.isVerified && <CheckCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                    {user.isBanned && <Ban className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  </div>
                  <div className="text-white/40 text-xs truncate">{user.email ?? user.location ?? "No info"}</div>
                </div>

                {/* Role badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                  user.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-purple-500/20 text-purple-300"
                }`}>
                  {user.role}
                </span>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => verifyMutation.mutate({ userId: user.id, verified: !user.isVerified })}
                    title={user.isVerified ? "Remove verification" : "Verify user"}
                    className={`p-1.5 rounded-lg transition-colors ${user.isVerified ? "text-blue-400 bg-blue-500/10" : "text-white/30 hover:text-blue-400 hover:bg-blue-500/10"}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => banMutation.mutate({ userId: user.id, ban: !user.isBanned })}
                    title={user.isBanned ? "Unban user" : "Ban user"}
                    className={`p-1.5 rounded-lg transition-colors ${user.isBanned ? "text-red-400 bg-red-500/10" : "text-white/30 hover:text-red-400 hover:bg-red-500/10"}`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                  {user.role === "admin" && (
                    <span title="Admin account" className="p-1.5 rounded-lg text-yellow-400 bg-yellow-500/10">
                      <Shield className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
