import { ReactNode, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, DollarSign, HeadphonesIcon, Settings2, Users,
  Megaphone, Shield, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type AdminPanelId = "finance" | "support" | "systems" | "users" | "announcements" | "roles" | "super";

const NAV_ITEMS: { id: AdminPanelId; label: string; icon: ReactNode; route: string }[] = [
  { id: "super", label: "Super Admin", icon: <LayoutDashboard className="w-4 h-4" />, route: "/admin/super" },
  { id: "finance", label: "Finance", icon: <DollarSign className="w-4 h-4" />, route: "/admin/finance" },
  { id: "support", label: "Support", icon: <HeadphonesIcon className="w-4 h-4" />, route: "/admin/support" },
  { id: "systems", label: "Systems & Settings", icon: <Settings2 className="w-4 h-4" />, route: "/admin/systems" },
  { id: "users", label: "User Management", icon: <Users className="w-4 h-4" />, route: "/admin/users" },
  { id: "announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" />, route: "/admin/announcements" },
  { id: "roles", label: "Roles & Credentials", icon: <Shield className="w-4 h-4" />, route: "/admin/roles" },
];

interface AdminShellProps {
  panelId: AdminPanelId;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AdminShell({ panelId, title, subtitle, children }: AdminShellProps) {
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionExpiry");
      localStorage.removeItem("adminPanel");
      toast.success("Logged out of admin portal");
      navigate("/admin-portal");
    },
  });

  const panelColors: Record<AdminPanelId, string> = {
    super: "#7c3aed",
    finance: "#059669",
    support: "#2563eb",
    systems: "#d97706",
    users: "#7c3aed",
    announcements: "#dc2626",
    roles: "#0891b2",
  };

  const accentColor = panelColors[panelId];

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0520", color: "#fff" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
        style={{ background: "rgba(20, 10, 50, 0.97)", borderRight: "1px solid rgba(139,92,246,0.2)" }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          <div>
            <div className="text-white font-bold text-sm">Faithful Hearts</div>
            <div className="text-yellow-400 text-[10px] tracking-widest uppercase">IT Management Portal</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === panelId;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(item.route); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                style={isActive ? { background: `${accentColor}22`, borderLeft: `3px solid ${accentColor}` } : {}}
              >
                <span style={isActive ? { color: accentColor } : {}}>{item.icon}</span>
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" style={{ color: accentColor }} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-purple-500/20">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-4 py-3 border-b border-purple-500/20"
          style={{ background: "rgba(10, 5, 32, 0.95)", backdropFilter: "blur(8px)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}22` }}
          >
            <span style={{ color: accentColor }}>
              {NAV_ITEMS.find(n => n.id === panelId)?.icon}
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm truncate">{title}</h1>
            {subtitle && <p className="text-white/40 text-xs truncate">{subtitle}</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div
              className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }}
            >
              {panelId}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
