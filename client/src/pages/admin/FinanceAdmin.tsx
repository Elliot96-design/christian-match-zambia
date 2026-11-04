import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, Users, CreditCard, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

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
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<Record<string, string>>({});
  const PAGE_SIZE = 20;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.admin.allPayments.useQuery();
  const { data: pendingManualPayments, isLoading: pendingLoading, refetch: refetchPending } = trpc.admin.getPendingManualPayments.useQuery();
  const { data: appSettings, refetch: refetchSettings } = trpc.admin.appSettings.useQuery();
  const updateSetting = trpc.admin.updateSetting.useMutation();

  useEffect(() => {
    if (appSettings) setPaymentSettings(Object.fromEntries(appSettings.filter((s) => s.settingKey.startsWith("payment_") || s.settingKey === "chat_unlock_amount").map((s) => [s.settingKey, s.settingValue])));
  }, [appSettings]);
  
  const approvePayment = trpc.admin.approveManualPayment.useMutation({
    onSuccess: () => {
      refetchPending();
      refetchStats();
      setApprovingId(null);
    },
  });
  const rejectPayment = trpc.admin.rejectManualPayment.useMutation({
    onSuccess: () => { refetchPending(); refetchPayments(); setRejectingId(null); toast.success("Payment rejected"); },
    onError: (error) => { setRejectingId(null); toast.error(error.message); },
  });

  const paginated = payments?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];
  const totalPages = Math.ceil((payments?.length ?? 0) / PAGE_SIZE);

  const handleRefresh = () => { refetchStats(); refetchPayments(); refetchPending(); refetchSettings(); };
  const setting = (key: string, fallback = "") => paymentSettings[key] ?? fallback;
  const setSetting = (key: string, value: string) => setPaymentSettings((current) => ({ ...current, [key]: value }));
  const savePaymentSettings = async () => {
    try {
      for (const [key, value] of Object.entries(paymentSettings)) await updateSetting.mutateAsync({ key, value });
      await refetchSettings();
      toast.success("Payment settings saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save payment settings"); }
  };

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

      <div className="mb-6 rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-white font-semibold text-sm">Payment Receiving Settings</h3><p className="text-white/40 text-xs mt-1">Only enabled methods with receiving details appear to users.</p></div>
          <button onClick={savePaymentSettings} disabled={updateSetting.isPending} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50"><Save className="w-4 h-4" />Save</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["mtn", "airtel"] as const).map((method) => (
            <div key={method} className="space-y-2 rounded-lg border border-white/10 p-3">
              <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" checked={setting(`payment_${method}_enabled`) === "true"} onChange={(e) => setSetting(`payment_${method}_enabled`, String(e.target.checked))} /> Enable {method === "mtn" ? "MTN Money" : "Airtel Money"}</label>
              <input value={setting(`payment_${method}_number`)} onChange={(e) => setSetting(`payment_${method}_number`, e.target.value)} placeholder="Receiving phone number" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
              <input value={setting(`payment_${method}_name`)} onChange={(e) => setSetting(`payment_${method}_name`, e.target.value)} placeholder="Account holder name" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
              <textarea value={setting(`payment_${method}_instructions`)} onChange={(e) => setSetting(`payment_${method}_instructions`, e.target.value)} placeholder="Payment instructions" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white min-h-16" />
            </div>
          ))}
          <div className="space-y-2 rounded-lg border border-white/10 p-3">
            <label className="flex items-center gap-2 text-xs text-white"><input type="checkbox" checked={setting("payment_bank_enabled") === "true"} onChange={(e) => setSetting("payment_bank_enabled", String(e.target.checked))} /> Enable Bank Transfer</label>
            <input value={setting("payment_bank_name")} onChange={(e) => setSetting("payment_bank_name", e.target.value)} placeholder="Bank name" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
            <input value={setting("payment_bank_account_name")} onChange={(e) => setSetting("payment_bank_account_name", e.target.value)} placeholder="Account holder" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
            <input value={setting("payment_bank_account_number")} onChange={(e) => setSetting("payment_bank_account_number", e.target.value)} placeholder="Account number" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
            <textarea value={setting("payment_bank_instructions")} onChange={(e) => setSetting("payment_bank_instructions", e.target.value)} placeholder="Bank transfer instructions" className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white min-h-16" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-md">
          <input value={setting("chat_unlock_amount", "20")} onChange={(e) => setSetting("chat_unlock_amount", e.target.value)} placeholder="Chat price (ZMW)" type="number" min="1" className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
          <input value={setting("payment_currency", "ZMW")} onChange={(e) => setSetting("payment_currency", e.target.value.toUpperCase())} placeholder="Currency" className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white" />
        </div>
      </div>

      {/* Pending Manual Payments */}
      <div className="mb-6 rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" style={{ background: "rgba(255,165,0,0.1)" }}>
          <h3 className="text-white font-semibold text-sm">⏳ Pending Manual Payments</h3>
          <span className="text-white/40 text-xs">{pendingManualPayments?.length ?? 0} awaiting approval</span>
        </div>

        {pendingLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading pending payments...</div>
        ) : !pendingManualPayments || pendingManualPayments.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No pending manual payments.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">ID</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Amount</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Provider</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Status</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Submitted</th>
                  <th className="text-left px-4 py-2 text-white/40 text-xs font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingManualPayments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white text-xs">#{p.id}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold text-xs">K{p.amount}</td>
                    <td className="px-4 py-3 text-white/70 text-xs capitalize">{p.provider}</td>
                    <td className="px-4 py-3 text-white/70 text-xs">
                      <span className="inline-block px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs">Pending</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (!window.confirm("Approve this payment and unlock the intended chat?")) return;
                          setApprovingId(p.id);
                          approvePayment.mutate({ paymentId: p.id });
                        }}
                        disabled={approvingId === p.id || approvePayment.isPending}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30 hover:border-green-600/60 disabled:opacity-40 transition-colors"
                      >
                        {approvingId === p.id ? "Approving..." : "Approve & Unlock"}
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt("Rejection reason (required):");
                          if (!reason?.trim()) return;
                          setRejectingId(p.id);
                          rejectPayment.mutate({ paymentId: p.id, reason: reason.trim() });
                        }}
                        disabled={rejectingId === p.id || rejectPayment.isPending}
                        className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 border border-red-600/30 disabled:opacity-40"
                      >Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
