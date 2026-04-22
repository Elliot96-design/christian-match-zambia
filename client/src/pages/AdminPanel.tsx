import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Ban, CheckCircle, CreditCard, Loader2, LogOut, Shield, Users } from "lucide-react";
import { LOGO_URL } from "@/components/AppHeader";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Tab = "users" | "payments";

export default function AdminPanel() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("users");
  const utils = trpc.useUtils();

  const { data: users, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: !!isAuthenticated && user?.role === "admin",
  });

  const { data: payments, isLoading: paymentsLoading } = trpc.admin.payments.useQuery(undefined, {
    enabled: !!isAuthenticated && user?.role === "admin" && tab === "payments",
  });

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      utils.admin.users.invalidate();
      toast.success("User status updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isAuthenticated || user?.role !== "admin") {
    navigate("/browse");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[480px] mx-auto">
      {/* Header */}
      <header className="hero-gradient px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate("/browse")} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <img src={LOGO_URL} alt="" className="w-8 h-8 rounded-lg object-cover opacity-90" />
        <p className="font-display font-bold text-white text-base flex-1">Admin Panel</p>
        <span className="badge-premium text-xs">Admin</span>
      </header>

      {/* Stats + Tabs */}
      <div className="container py-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground">{users?.length ?? "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-bold text-foreground">{payments?.length ?? "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-secondary rounded-2xl p-1 flex mb-4">
          <button
            onClick={() => setTab("users")}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              tab === "users" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
          <button
            onClick={() => setTab("payments")}
            className={`flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              tab === "payments" ? "bg-primary text-white shadow-sm" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payments
          </button>
        </div>

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-2">
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !users || users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users yet</p>
            ) : (
              users.map((u) => (
                <div key={u.id} className={`bg-card border rounded-xl p-4 ${u.isBanned ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-sm truncate">{u.name ?? "No name"}</p>
                        {u.role === "admin" && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin</span>
                        )}
                        {u.isBanned && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Banned</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{u.email ?? u.phone ?? "No contact"}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.location ?? "—"} · {u.church ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {u.role !== "admin" && (
                      <Button
                        variant={u.isBanned ? "outline" : "destructive"}
                        size="sm"
                        className="flex-shrink-0 h-8 text-xs rounded-lg"
                        onClick={() => banUser.mutate({ userId: u.id, ban: !u.isBanned })}
                        disabled={banUser.isPending}
                      >
                        {u.isBanned ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Unban</>
                        ) : (
                          <><Ban className="w-3 h-3 mr-1" /> Ban</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Payments Tab */}
        {tab === "payments" && (
          <div className="space-y-2">
            {paymentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !payments || payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payments yet</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {p.payerName ?? `User #${p.payerId}`} → {p.targetName ?? `User #${p.targetId}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.provider.toUpperCase()} · Ref: {p.reference ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-foreground">K{p.amount}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : p.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
