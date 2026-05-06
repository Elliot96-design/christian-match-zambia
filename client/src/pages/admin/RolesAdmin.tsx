import { useState } from "react";
import AdminShell from "@/components/AdminShell";
import { trpc } from "@/lib/trpc";
import { Plus, Key, RefreshCw, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const PANELS = [
  { id: "finance", label: "Finance Admin" },
  { id: "support", label: "Support Admin" },
  { id: "systems", label: "Systems & Settings" },
  { id: "users", label: "User Management" },
  { id: "announcements", label: "Announcement Center" },
  { id: "roles", label: "Roles & Credentials" },
  { id: "super", label: "Super Admin" },
] as const;

export default function RolesAdmin() {
  const [showForm, setShowForm] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | "">("");
  const [adminUsername, setAdminUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [panel, setPanel] = useState<typeof PANELS[number]["id"]>("finance");

  const { data: admins, isLoading, refetch } = trpc.admin.allAdmins.useQuery();
  const { data: users } = trpc.admin.users.useQuery();

  const promoteMutation = trpc.admin.promoteToAdmin.useMutation({
    onSuccess: () => {
      toast.success("Admin credentials set successfully");
      setShowForm(false);
      setTargetUserId(""); setAdminUsername(""); setPassword(""); setPin("");
      refetch();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!targetUserId) { toast.error("Select a user"); return; }
    if (!adminUsername.trim()) { toast.error("Username required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!/^\d{4}$/.test(pin)) { toast.error("PIN must be exactly 4 digits"); return; }
    promoteMutation.mutate({
      userId: Number(targetUserId),
      adminUsername,
      password,
      pin,
      adminPanel: panel,
    });
  };

  return (
    <AdminShell panelId="roles" title="Roles & Credentials" subtitle="Manage admin accounts and panel access">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white/60 text-sm">{admins?.length ?? 0} admin accounts configured</div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-3 py-2 rounded-lg text-white/60 border border-white/10 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showForm ? "Cancel" : "Add Admin"}
          </button>
        </div>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/30 p-5 mb-5" style={{ background: "rgba(99,102,241,0.08)" }}>
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            Set Admin Credentials
          </h3>
          <div className="space-y-3">
            {/* User selector */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Assign to User</label>
              <select
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
              >
                <option value="">Select a user...</option>
                {(users ?? []).map(u => (
                  <option key={u.id} value={u.id}>{u.name ?? "Unknown"} (ID: {u.id})</option>
                ))}
              </select>
            </div>

            {/* Panel selector */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Assign to Panel</label>
              <select
                value={panel}
                onChange={e => setPanel(e.target.value as typeof panel)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
              >
                {PANELS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {/* Username */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Admin Username</label>
              <input
                type="text"
                placeholder="e.g. finance"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-10 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-500/50"
                />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="text-white/60 text-xs font-medium block mb-1.5">Quick PIN (4 digits)</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g. 1234"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 outline-none focus:border-indigo-500/50 tracking-widest"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={promoteMutation.isPending}
              className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
            >
              {promoteMutation.isPending ? "Saving..." : "Save Admin Credentials"}
            </button>
          </div>
        </div>
      )}

      {/* Admin accounts list */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">Admin Accounts</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-white/40 text-sm">Loading...</div>
        ) : !admins?.length ? (
          <div className="p-8 text-center text-white/40 text-sm">No admin accounts configured yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {admins.map((admin: { id: number; name: string | null; adminUsername: string | null; adminPanel: string | null }) => (
              <div key={admin.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99,102,241,0.2)" }}>
                  <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium">{admin.name ?? "Unknown"}</div>
                  <div className="text-white/40 text-xs">@{admin.adminUsername ?? "no username set"}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 flex-shrink-0">
                  {PANELS.find(p => p.id === admin.adminPanel)?.label ?? admin.adminPanel ?? "Unknown Panel"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credentials reference */}
      <div className="mt-4 rounded-xl border border-yellow-500/20 p-4" style={{ background: "rgba(234,179,8,0.05)" }}>
        <h4 className="text-yellow-400 font-semibold text-xs mb-2">Default Admin Credentials (change immediately)</h4>
        <div className="grid grid-cols-1 gap-1 text-xs text-white/50">
          <div>Finance: <span className="text-white/70">finance / finance@2026 / PIN: 1234</span></div>
          <div>Support: <span className="text-white/70">support / support@2026 / PIN: 2345</span></div>
          <div>Systems: <span className="text-white/70">systems / systems@2026 / PIN: 3456</span></div>
          <div>Users: <span className="text-white/70">usermgmt / usermgmt@2026 / PIN: 4567</span></div>
          <div>Announcements: <span className="text-white/70">content / content@2026 / PIN: 5678</span></div>
          <div>Roles: <span className="text-white/70">roles / roles@2026 / PIN: 6789</span></div>
          <div>Super Admin: <span className="text-white/70">superadmin / super@2026 / PIN: 9999</span></div>
        </div>
      </div>
    </AdminShell>
  );
}
