import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Crown, X, CheckCircle, AlertTriangle, Calendar, Zap } from "lucide-react";

interface ManagePlanModalProps {
  onClose: () => void;
  onCancelled?: () => void;
}

export default function ManagePlanModal({ onClose, onCancelled }: ManagePlanModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: plan, isLoading } = trpc.profile.getPlanDetails.useQuery();
  const utils = trpc.useUtils();

  const cancelPremium = trpc.profile.cancelPremium.useMutation({
    onSuccess: () => {
      toast.success("Premium cancelled. Your benefits have been removed.");
      utils.profile.getPlanDetails.invalidate();
      utils.profile.premiumStatus.invalidate();
      utils.auth.me.invalidate();
      setShowCancelConfirm(false);
      onCancelled?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to cancel premium.");
    },
  });

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-ZM", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "#1a0533", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "linear-gradient(135deg, #4a0e8f 0%, #2d0660 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(212,160,23,0.2)", border: "1px solid #d4a017" }}
            >
              <Crown size={20} style={{ color: "#d4a017" }} />
            </div>
            <div>
              <p className="font-bold text-white text-base">Manage Plan</p>
              <p className="text-xs" style={{ color: "#d4a017" }}>
                Faithful Hearts Premium
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#d4a017", borderTopColor: "transparent" }}
            />
          </div>
        ) : plan?.isPremium ? (
          <div className="px-5 py-5 space-y-5">
            {/* Plan Status Card */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm">{plan.planType}</span>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}
                >
                  Active
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Member since
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} style={{ color: "#d4a017" }} />
                    <p className="text-xs font-medium text-white">
                      {formatDate(plan.premiumSince)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Next renewal
                  </p>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} style={{ color: "#d4a017" }} />
                    <p className="text-xs font-medium text-white">
                      {formatDate(plan.renewalDate)}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="mt-3 pt-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(212,160,23,0.2)" }}
              >
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Monthly fee
                </span>
                <span className="font-bold" style={{ color: "#d4a017" }}>
                  K{plan.amount} / month
                </span>
              </div>
            </div>

            {/* Benefits */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap size={14} style={{ color: "#d4a017" }} />
                Your Premium Benefits
              </p>
              <div className="space-y-2">
                {plan.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: "#4ade80", flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Section */}
            {!showCancelConfirm ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                }}
              >
                Cancel Premium Subscription
              </button>
            ) : (
              <div
                className="rounded-2xl p-4 space-y-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                      Cancel Premium?
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Your premium benefits will be removed immediately. You can re-subscribe at any time.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  >
                    Keep Premium
                  </button>
                  <button
                    onClick={() => cancelPremium.mutate()}
                    disabled={cancelPremium.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "#ef4444", color: "white" }}
                  >
                    {cancelPremium.isPending ? "Cancelling…" : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Non-premium fallback — shouldn't normally appear since button is only shown to premium users */
          <div className="px-5 py-10 text-center">
            <Crown size={40} style={{ color: "#d4a017", margin: "0 auto 12px" }} />
            <p className="text-white font-semibold mb-2">You're not a Premium member yet</p>
            <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
              Upgrade to Premium to enjoy unlimited chat unlocks and more.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, #d4a017, #f0c040)", color: "#1a0533" }}
            >
              Close
            </button>
          </div>
        )}

        {/* Safe area padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}
