import { useState } from "react";
import { X, Loader2, Lock, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Plan = "1month" | "3months";
type Provider = "mtn" | "airtel" | "visa";

interface PremiumCheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PLANS = [
  {
    id: "1month" as Plan,
    name: "1 Month",
    price: 50,
    popular: true,
    renewal: "K100 / month after",
    savings: null,
  },
  {
    id: "3months" as Plan,
    name: "3 Months",
    price: 250,
    popular: false,
    renewal: "K83 / month billed every 3 months",
    savings: "Save 17%",
  },
];

const PROVIDERS = [
  {
    id: "mtn" as Provider,
    label: "MTN Mobile Money",
    logo: "MTN",
    bgColor: "#FFC107",
    textColor: "#000",
    manualNumber: "+260964214471",
  },
  {
    id: "airtel" as Provider,
    label: "Airtel Money",
    logo: "airtel",
    bgColor: "#E53935",
    textColor: "#fff",
    manualNumber: "+260776550784",
  },
  {
    id: "visa" as Provider,
    label: "Visa / Mastercard",
    logo: "VISA",
    bgColor: "#1A1F71",
    textColor: "#fff",
    manualNumber: null,
  },
];

const FEATURES = [
  "Unlimited likes & matches",
  "See who likes you",
  "Chat without limits",
  "Voice & video calls",
  "Prayer sessions",
  "Advanced filters",
  "Chatroom access",
  "Read receipts",
  "Profile boost",
  "Priority support",
];

type Step = "plan" | "method" | "phone" | "confirm" | "success";

export default function PremiumCheckoutModal({ onClose, onSuccess }: PremiumCheckoutModalProps) {
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("1month");
  const [selectedProvider, setSelectedProvider] = useState<Provider>("mtn");
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
      }, 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const currentPlan = PLANS.find((p) => p.id === selectedPlan)!;
  const currentProvider = PROVIDERS.find((p) => p.id === selectedProvider)!;

  const handleContinue = () => {
    if (step === "plan") {
      setStep("method");
    } else if (step === "method") {
      if (selectedProvider === "visa") {
        setStep("confirm");
        initiate.mutate({ provider: selectedProvider });
      } else {
        setStep("phone");
      }
    }
  };

  const handlePhoneSubmit = () => {
    if (phone.trim().length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }
    initiate.mutate({ provider: selectedProvider, phone: phone.trim() });
  };

  const handleConfirm = () => {
    if (paymentId === null) return;
    confirm.mutate({ paymentId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl overflow-y-auto max-h-[90vh] sm:max-h-none"
        style={{ background: "oklch(0.22 0.18 290)" }}
      >
        {/* Header */}
        <div className="sticky top-0 px-4 pt-4 pb-3 flex items-center justify-between z-10" style={{ background: "oklch(0.22 0.18 290)", borderBottom: "1px solid oklch(0.35 0.12 290)" }}>
          <div>
            <h2 className="font-display font-bold text-lg text-white">Go Premium</h2>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.72 0.16 80)" }}>
              Unlock full access and find your God-ordained partner.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.35 0.12 290)" }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-4 py-5">
          {/* Step: Choose Plan */}
          {step === "plan" && (
            <div>
              {/* Plan cards */}
              <div className="space-y-3 mb-5">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="w-full rounded-2xl p-4 text-left transition-all active:scale-[0.98] relative"
                    style={{
                      background: selectedPlan === plan.id ? "oklch(0.28 0.20 290)" : "oklch(0.15 0.10 290)",
                      border: selectedPlan === plan.id ? "2px solid oklch(0.72 0.16 80)" : "1px solid oklch(0.35 0.12 290)",
                    }}
                  >
                    {plan.popular && (
                      <div
                        className="absolute -top-2 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
                      >
                        MOST POPULAR
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-white">{plan.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "oklch(0.70 0.05 290)" }}>
                          {plan.renewal}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold" style={{ color: "oklch(0.72 0.16 80)" }}>
                          K{plan.price}
                        </p>
                        {plan.id === "1month" && (
                          <p className="text-xs mt-0.5" style={{ color: "oklch(0.72 0.16 80)" }}>
                            First Month
                          </p>
                        )}
                        {plan.savings && (
                          <p className="text-xs mt-0.5" style={{ color: "oklch(0.65 0.20 145)" }}>
                            {plan.savings}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Checkmark */}
                    {selectedPlan === plan.id && (
                      <div className="absolute top-3 right-3">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "oklch(0.72 0.16 80)" }}
                        >
                          <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                            <path d="M2 6l3 3 5-5" stroke="oklch(0.22 0.18 290)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Features */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: "oklch(0.15 0.10 290)" }}>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
                        <path d="M2 6l3 3 5-5" stroke="oklch(0.72 0.16 80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-xs text-white">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                Continue to Payment
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Step: Choose Payment Method */}
          {step === "method" && (
            <div>
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-xs font-medium mb-4"
                style={{ color: "oklch(0.72 0.16 80)" }}
              >
                ← Back
              </button>

              <p className="text-sm font-bold text-white mb-3">Choose Payment Method</p>

              <div className="space-y-3 mb-5">
                {PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98]"
                    style={{
                      background: selectedProvider === provider.id ? "oklch(0.28 0.20 290)" : "oklch(0.15 0.10 290)",
                      border: selectedProvider === provider.id ? "2px solid oklch(0.72 0.16 80)" : "1px solid oklch(0.35 0.12 290)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ background: provider.bgColor, color: provider.textColor }}
                    >
                      {provider.logo}
                    </div>
                    <p className="flex-1 text-left font-semibold text-white text-sm">{provider.label}</p>

                    {selectedProvider === provider.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(0.72 0.16 80)" }}
                      >
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                          <path d="M2 6l3 3 5-5" stroke="oklch(0.22 0.18 290)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Security notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl mb-5" style={{ background: "oklch(0.15 0.10 290)" }}>
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "oklch(0.72 0.16 80)" }} />
                <div>
                  <p className="text-xs font-semibold text-white">Your payment is safe and secure.</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.70 0.05 290)" }}>
                    We do not store your card or mobile money details.
                  </p>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                Continue to Payment
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Step: Enter Phone */}
          {step === "phone" && (
            <div>
              <button
                onClick={() => setStep("method")}
                className="flex items-center gap-1 text-xs font-medium mb-4"
                style={{ color: "oklch(0.72 0.16 80)" }}
              >
                ← Back
              </button>

              <div className="rounded-2xl p-3 mb-4" style={{ background: "oklch(0.15 0.10 290)" }}>
                <p className="text-xs font-bold text-white mb-2">Manual Payment Option</p>
                <p className="text-xs mb-2" style={{ color: "oklch(0.70 0.05 290)" }}>
                  Send K{currentPlan.price} to:
                </p>
                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.22 0.18 290)" }}>
                  <svg className="w-4 h-4" style={{ color: "oklch(0.72 0.16 80)" }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                  <span className="text-sm font-mono text-white flex-1">{currentProvider.manualNumber}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentProvider.manualNumber || "");
                      toast.success("Copied!");
                    }}
                    className="text-xs px-2 py-1 rounded" style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs mt-2" style={{ color: "oklch(0.70 0.05 290)" }}>
                  After sending, we'll review and activate your account within 24 hours.
                </p>
              </div>

              <p className="text-sm font-bold text-white mb-1">Or enter your {currentProvider.label} number</p>
              <p className="text-xs mb-4" style={{ color: "oklch(0.70 0.05 290)" }}>
                You will receive a payment prompt on this number for K{currentPlan.price}.
              </p>

              <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4" style={{ background: "oklch(0.15 0.10 290)", border: "1px solid oklch(0.35 0.12 290)" }}>
                <span style={{ color: "oklch(0.70 0.05 290)" }}>+260</span>
                <input
                  type="tel"
                  placeholder="977 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 text-sm outline-none text-white placeholder:text-gray-400"
                  style={{ background: "transparent" }}
                />
              </div>

              <button
                onClick={handlePhoneSubmit}
                disabled={initiate.isPending}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                {initiate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {initiate.isPending ? "Sending prompt…" : "Send Payment Prompt"}
              </button>
            </div>
          )}

          {/* Step: Confirm Payment */}
          {step === "confirm" && (
            <div className="text-center">
              <div className="rounded-2xl p-4 mb-5 text-left" style={{ background: "oklch(0.15 0.10 290)" }}>
                <p className="text-xs font-bold text-white mb-1">
                  {selectedProvider === "visa" ? "Ready to complete payment" : "Payment prompt sent"}
                </p>
                <p className="text-xs" style={{ color: "oklch(0.70 0.05 290)" }}>
                  {selectedProvider === "visa"
                    ? "Tap below to securely complete your premium upgrade using Visa or Mastercard."
                    : `Check your phone for the ${currentProvider.label} payment prompt. Once you approve it, tap the button below to complete your upgrade.`}
                </p>
              </div>

              <div className="text-4xl font-display font-bold mb-1 text-white">
                K{currentPlan.price}
              </div>
              <p className="text-xs mb-6" style={{ color: "oklch(0.70 0.05 290)" }}>
                {currentPlan.renewal}
              </p>

              <button
                onClick={handleConfirm}
                disabled={confirm.isPending || !paymentId}
                className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                {confirm.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {confirm.isPending ? "Activating…" : "I've Paid — Activate Premium"}
              </button>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "oklch(0.72 0.16 80 / 0.2)" }}
              >
                <CheckCircle className="w-8 h-8" style={{ color: "oklch(0.72 0.16 80)" }} />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-1">Welcome to Premium!</h3>
              <p className="text-sm" style={{ color: "oklch(0.70 0.05 290)" }}>
                Your account has been upgraded. Enjoy unlimited connections and all premium features.
              </p>
            </div>
          )}
        </div>

        {/* Footer security badge */}
        {(step === "plan" || step === "method") && (
          <div className="px-4 py-3 text-center border-t" style={{ borderColor: "oklch(0.35 0.12 290)" }}>
            <p className="text-xs flex items-center justify-center gap-1" style={{ color: "oklch(0.70 0.05 290)" }}>
              <Lock className="w-3 h-3" />
              Secure payments powered by SSL encryption
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
