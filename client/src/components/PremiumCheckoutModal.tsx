import { useState } from "react";
import { Crown, X, Phone, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Provider = "mtn" | "airtel" | "mock";

interface PremiumCheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PROVIDERS = [
  {
    id: "mtn" as Provider,
    label: "MTN Mobile Money",
    color: "#FFC107",
    bg: "#FFF8E1",
    logo: "MTN",
  },
  {
    id: "airtel" as Provider,
    label: "Airtel Money",
    color: "#E53935",
    bg: "#FFEBEE",
    logo: "Airtel",
  },
  {
    id: "mock" as Provider,
    label: "Test / Demo Pay",
    color: "oklch(0.45 0.18 290)",
    bg: "oklch(0.96 0.02 290)",
    logo: "DEMO",
  },
];

type Step = "choose" | "phone" | "confirm" | "success";

export default function PremiumCheckoutModal({ onClose, onSuccess }: PremiumCheckoutModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [provider, setProvider] = useState<Provider | null>(null);
  const [phone, setPhone] = useState("");
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const initiate = trpc.payment.initiatePremium.useMutation({
    onSuccess: (data) => {
      setPaymentId(data.paymentId);
      setStep("confirm");
    },
    onError: (e) => toast.error(e.message),
  });

  const confirm = trpc.payment.confirmPremium.useMutation({
    onSuccess: () => {
      setStep("success");
      setTimeout(() => {
        onSuccess();
      }, 1800);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleChooseProvider = (p: Provider) => {
    setProvider(p);
    if (p === "mock") {
      setStep("confirm");
      initiate.mutate({ provider: p });
    } else {
      setStep("phone");
    }
  };

  const handlePhoneSubmit = () => {
    if (!provider) return;
    if (phone.trim().length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }
    initiate.mutate({ provider, phone: phone.trim() });
  };

  const handleConfirm = () => {
    if (paymentId === null) return;
    confirm.mutate({ paymentId });
  };

  const selectedProvider = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: "white" }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{ background: "oklch(0.28 0.20 290)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.72 0.16 80 / 0.2)" }}
            >
              <Crown className="w-5 h-5" style={{ color: "oklch(0.72 0.16 80)" }} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Upgrade to Premium</p>
              <p style={{ color: "oklch(0.72 0.16 80)" }} className="text-xs font-semibold">
                K50 / month — Unlimited connections
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Step: Choose provider */}
          {step === "choose" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4">Choose payment method</p>
              <div className="flex flex-col gap-3">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleChooseProvider(p.id)}
                    className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98]"
                    style={{ borderColor: "oklch(0.90 0.02 290)", background: p.bg }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                      style={{ background: p.color }}
                    >
                      {p.logo}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800 text-sm">{p.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Pay K50 via {p.label}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Benefits reminder */}
              <div
                className="mt-4 rounded-2xl p-4"
                style={{ background: "oklch(0.96 0.02 290)" }}
              >
                <p className="text-xs font-bold mb-2" style={{ color: "oklch(0.28 0.20 290)" }}>
                  Premium Benefits
                </p>
                {[
                  "Unlimited chat unlocks",
                  "Premium badge on your profile",
                  "Priority in browse results",
                  "See who liked your profile",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "oklch(0.72 0.16 80)" }}
                    >
                      <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-600">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step: Enter phone */}
          {step === "phone" && selectedProvider && (
            <div>
              <button
                onClick={() => setStep("choose")}
                className="flex items-center gap-1 text-xs font-medium mb-4"
                style={{ color: "oklch(0.45 0.18 290)" }}
              >
                ← Back
              </button>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Enter your {selectedProvider.label} number
              </p>
              <p className="text-xs text-gray-400 mb-4">
                You will receive a payment prompt on this number for K50.
              </p>
              <div className="flex items-center gap-3 border-2 rounded-2xl px-4 py-3 mb-4" style={{ borderColor: "oklch(0.90 0.02 290)" }}>
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="tel"
                  placeholder="e.g. 0977 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 text-sm outline-none text-gray-800 placeholder:text-gray-300"
                />
              </div>
              <button
                onClick={handlePhoneSubmit}
                disabled={initiate.isPending}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "oklch(0.28 0.20 290)", color: "white" }}
              >
                {initiate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {initiate.isPending ? "Sending prompt…" : "Send Payment Prompt"}
              </button>
            </div>
          )}

          {/* Step: Confirm payment */}
          {step === "confirm" && (
            <div className="text-center">
              {provider !== "mock" && (
                <div
                  className="rounded-2xl p-4 mb-5 text-left"
                  style={{ background: "oklch(0.96 0.02 290)" }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: "oklch(0.28 0.20 290)" }}>
                    Payment prompt sent
                  </p>
                  <p className="text-xs text-gray-500">
                    Check your phone for the {selectedProvider?.label} payment prompt. Once you approve it, tap the button below to complete your upgrade.
                  </p>
                </div>
              )}
              {provider === "mock" && (
                <div
                  className="rounded-2xl p-4 mb-5 text-left"
                  style={{ background: "oklch(0.96 0.02 290)" }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: "oklch(0.28 0.20 290)" }}>
                    Demo mode
                  </p>
                  <p className="text-xs text-gray-500">
                    This is a test payment. Tap below to simulate a successful K50 premium upgrade.
                  </p>
                </div>
              )}
              <div className="text-3xl font-display font-bold mb-1" style={{ color: "oklch(0.28 0.20 290)" }}>
                K50
              </div>
              <p className="text-xs text-gray-400 mb-5">Premium membership — one month</p>
              <button
                onClick={handleConfirm}
                disabled={confirm.isPending || !paymentId}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                {confirm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {confirm.isPending ? "Activating…" : "I've Paid — Activate Premium"}
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "oklch(0.72 0.16 80 / 0.15)" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: "oklch(0.72 0.16 80)" }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-1" style={{ color: "oklch(0.28 0.20 290)" }}>
                Welcome to Premium!
              </h3>
              <p className="text-sm text-gray-500">
                Your account has been upgraded. Enjoy unlimited connections!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
