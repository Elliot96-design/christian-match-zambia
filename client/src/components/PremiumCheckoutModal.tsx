import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Lock, CheckCircle, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Plan = "1month" | "3months";
type Provider = "mtn" | "airtel" | "bank";

interface PremiumCheckoutModalProps { onClose: () => void; onSuccess: () => void; }

const PLANS = [
  { id: "1month" as Plan, name: "1 Month", price: 50, renewal: "K100 / month after", savings: null },
  { id: "3months" as Plan, name: "3 Months", price: 250, renewal: "Billed every 3 months", savings: "Save 17%" },
];
const FEATURES = ["Unlimited likes & matches", "See who likes you", "Chat without limits", "Voice & video calls", "Prayer sessions", "Advanced filters", "Chatroom access", "Read receipts", "Profile boost", "Priority support"];

type Step = "plan" | "method" | "details" | "submitted";

export default function PremiumCheckoutModal({ onClose, onSuccess }: PremiumCheckoutModalProps) {
  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<Plan>("1month");
  const [provider, setProvider] = useState<Provider>("mtn");
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const configuration = trpc.payment.configuration.useQuery();
  const initiate = trpc.payment.initiatePremium.useMutation({ onSuccess: () => setStep("submitted"), onError: (error) => toast.error(error.message) });
  const config = configuration.data;
  const currentPlan = PLANS.find((plan) => plan.id === selectedPlan)!;
  const availableProviders = useMemo<Provider[]>(() => config ? (["mtn", "airtel", "bank"] as Provider[]).filter((method) => config.methods[method]) : [], [config]);
  useEffect(() => { if (availableProviders.length && !availableProviders.includes(provider)) setProvider(availableProviders[0]); }, [availableProviders, provider]);
  const details = config?.details ?? {};
  const paymentInfo = provider === "mtn"
    ? { label: "MTN Money", number: details.payment_mtn_number, name: details.payment_mtn_name, instructions: details.payment_mtn_instructions, reference: details.payment_mtn_reference }
    : provider === "airtel"
      ? { label: "Airtel Money", number: details.payment_airtel_number, name: details.payment_airtel_name, instructions: details.payment_airtel_instructions, reference: details.payment_airtel_reference }
      : { label: "Bank Transfer", number: details.payment_bank_account_number, name: details.payment_bank_account_name, instructions: details.payment_bank_instructions, reference: details.payment_bank_reference };

  const submit = () => {
    if (transactionId.trim().length < 3) { toast.error("Enter the transaction ID or bank reference"); return; }
    initiate.mutate({ amount: currentPlan.price as 50 | 250, provider, transactionId: transactionId.trim(), senderPhone: senderPhone.trim() || undefined, senderName: senderName.trim() || undefined });
  };
  const copy = (value?: string | null) => { if (value) { void navigator.clipboard?.writeText(value); toast.success("Copied"); } };
  const shell = { background: "oklch(0.22 0.18 290)" };
  const panel = { background: "oklch(0.15 0.10 290)", border: "1px solid oklch(0.35 0.12 290)" };
  const gold = { background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" };

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60">
    <div className="relative w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl overflow-y-auto max-h-[92vh]" style={shell}>
      <div className="sticky top-0 px-4 pt-4 pb-3 flex items-center justify-between z-10" style={{ ...shell, borderBottom: "1px solid oklch(0.35 0.12 290)" }}>
        <div><h2 className="font-display font-bold text-lg text-white">Go Premium</h2><p className="text-xs mt-0.5" style={{ color: "oklch(0.72 0.16 80)" }}>Unlock full access and find your God-ordained partner.</p></div>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={panel}><X className="w-4 h-4 text-white" /></button>
      </div>
      <div className="px-4 py-5">
        {step === "plan" && <>
          <div className="space-y-3 mb-5">{PLANS.map((plan) => <button key={plan.id} onClick={() => setSelectedPlan(plan.id)} className="w-full rounded-2xl p-4 text-left relative" style={{ background: selectedPlan === plan.id ? "oklch(0.28 0.20 290)" : panel.background, border: selectedPlan === plan.id ? "2px solid oklch(0.72 0.16 80)" : panel.border }}>
            <div className="flex items-start justify-between"><div><p className="font-bold text-white">{plan.name}</p><p className="text-xs mt-1" style={{ color: "oklch(0.70 0.05 290)" }}>{plan.renewal}</p></div><div className="text-right"><p className="text-3xl font-bold" style={{ color: "oklch(0.72 0.16 80)" }}>K{plan.price}</p>{plan.savings && <p className="text-xs" style={{ color: "oklch(0.65 0.20 145)" }}>{plan.savings}</p>}</div></div>
+          </button>)}</div>
          <div className="rounded-2xl p-4 mb-5" style={panel}><div className="grid grid-cols-2 gap-2">{FEATURES.map((feature) => <div key={feature} className="flex items-start gap-2"><span style={{ color: "oklch(0.72 0.16 80)" }}>✓</span><p className="text-xs text-white">{feature}</p></div>)}</div></div>
          <button onClick={() => setStep("method")} className="w-full py-3.5 rounded-2xl font-bold text-sm" style={gold}>Continue to Payment</button>
        </>}
        {step === "method" && <>
          <button onClick={() => setStep("plan")} className="text-xs font-medium mb-4" style={{ color: "oklch(0.72 0.16 80)" }}>← Back</button><p className="text-sm font-bold text-white mb-3">Choose Payment Method</p>
          {configuration.isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-white" /> : availableProviders.length === 0 ? <div className="p-4 rounded-xl text-sm text-amber-200" style={panel}>Payment methods are not configured yet. Please contact support.</div> : <>
            <div className="space-y-3 mb-5">{availableProviders.map((method) => <button key={method} onClick={() => setProvider(method)} className="w-full flex items-center gap-3 p-4 rounded-2xl" style={{ background: provider === method ? "oklch(0.28 0.20 290)" : panel.background, border: provider === method ? "2px solid oklch(0.72 0.16 80)" : panel.border }}><div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: method === "mtn" ? "#FFC107" : method === "airtel" ? "#E53935" : "#475569", color: method === "mtn" ? "#000" : "#fff" }}>{method === "mtn" ? "MTN" : method === "airtel" ? "airtel" : "BANK"}</div><p className="flex-1 text-left font-semibold text-white text-sm">{paymentInfo.label}</p>{provider === method && <span className="text-yellow-300">✓</span>}</button>)}</div>
            <button onClick={() => setStep("details")} className="w-full py-3.5 rounded-2xl font-bold text-sm" style={gold}>Continue to Payment</button>
          </>}
        </>}
        {step === "details" && <>
          <button onClick={() => setStep("method")} className="text-xs font-medium mb-4" style={{ color: "oklch(0.72 0.16 80)" }}>← Back</button>
          <div className="rounded-2xl p-4 mb-4" style={panel}><p className="text-xs font-bold text-white mb-2">Send K{currentPlan.price} via {paymentInfo.label}</p><div className="flex justify-between items-center text-sm text-white"><span className="text-white/60">Recipient</span><span>{paymentInfo.name || "Not configured"}</span></div><div className="flex justify-between items-center text-sm text-white mt-2"><span className="text-white/60">Number/account</span><span className="flex items-center">{paymentInfo.number || "Not configured"}{paymentInfo.number && <button onClick={() => copy(paymentInfo.number)} className="ml-1"><Copy className="w-4 h-4" /></button>}</span></div>{paymentInfo.reference && <div className="flex justify-between items-center text-sm text-white mt-2"><span className="text-white/60">Reference</span><span>{paymentInfo.reference}</span></div>}<p className="text-xs mt-3 whitespace-pre-line" style={{ color: "oklch(0.70 0.05 290)" }}>{paymentInfo.instructions || "Complete the payment externally, then submit the transaction reference below."}</p></div>
          <div className="space-y-3"><input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Transaction ID / bank reference" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none" style={panel} /><input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="Sender mobile number (optional)" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none" style={panel} /><input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Sender/account name (optional)" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none" style={panel} /></div>
          <button onClick={submit} disabled={initiate.isPending || !paymentInfo.number} className="w-full py-3.5 rounded-2xl font-bold text-sm mt-5 disabled:opacity-60" style={gold}>{initiate.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Payment for Verification"}</button><p className="text-xs text-white/50 text-center mt-3">Premium activates only after Finance Admin verifies the payment.</p>
        </>}
        {step === "submitted" && <div className="text-center py-8"><CheckCircle className="w-16 h-16 mx-auto mb-4 text-yellow-300" /><h3 className="font-display font-bold text-xl text-white mb-2">Payment Submitted</h3><p className="text-sm text-white/60">Your premium payment is pending verification. We will activate premium after Finance confirms the transaction.</p><button onClick={() => { onSuccess(); onClose(); }} className="w-full py-3.5 rounded-2xl font-bold text-sm mt-6" style={gold}>Done</button></div>}
      </div>
      {(step === "plan" || step === "method") && <div className="px-4 py-3 text-center border-t" style={{ borderColor: "oklch(0.35 0.12 290)" }}><p className="text-xs flex items-center justify-center gap-1 text-white/60"><Lock className="w-3 h-3" /> Secure manual payment verification</p></div>}
    </div>
  </div>;
}
