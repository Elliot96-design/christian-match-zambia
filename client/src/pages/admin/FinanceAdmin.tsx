import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, CreditCard, RefreshCw } from "lucide-react";

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl p-4 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

export default function FinanceAdmin() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.admin.allPayments.useQuery();

  const paginated = payments?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];
  const totalPages = Math.ceil((payments?.length ?? 0) / PAGE_SIZE);

  const handleRefresh = () => { refetchStats(); refetchPayments(); };

  const statusColor = (s: string) => {
    if (s === "completed") return "#10b981";
    if (s === "pending") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <AdminShell panelId="finance" title="Finance Admin" subtitle="Revenue, payments & subscriptions">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-lg">Financial Overview</h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-4 border border-white/10 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", height: 96 }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Total Revenue" value={`K${stats?.totalRevenue ?? 0}`} icon={<DollarSign className="w-4 h-4" />} color="#10b981" />
          <StatCard label="Chat Unlock Revenue" value={`K${stats?.chatUnlockRevenue ?? 0}`} icon={<CreditCard className="w-4 h-4" />} color="#059669" />
          <StatCard label="Premium Revenue" value={`K${stats?.premiumRevenue ?? 0}`} icon={<TrendingUp className="w-4 h-4" />} color="#f59e0b" />
          <StatCard label="Total Payments" value={stats?.totalPayments ?? 0} icon={<Users className="w-4 h-4" />} color="#3b82f6" />
        </div>
      )}

      {/* Payments table */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Payment Records</h3>
          <span className="text-white/40 text-xs">{payments?.length ?? 0} total</span>
        </div>

        {paymentsLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading payments...</div>
        ) : paginated.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No payment records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">ID</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">User</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Amount</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Provider</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white/50 text-xs">#{p.id}</td>
                    <td className="px-4 py-3 text-white text-xs">{p.userName ?? "Unknown"}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold text-xs">K{p.amount}</td>
                    <td className="px-4 py-3 text-white/70 text-xs capitalize">{p.provider}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: `${statusColor(p.status)}22`, color: statusColor(p.status) }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs text-white/60 border border-white/10 disabled:opacity-40 hover:border-white/20 transition-colors"
            >
              Previous
            </button>
            <span className="text-white/40 text-xs">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs text-white/60 border border-white/10 disabled:opacity-40 hover:border-white/20 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
