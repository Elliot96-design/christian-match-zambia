import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Copy, Loader2, Phone, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Provider = "mtn" | "airtel" | "bank";

interface PaymentModalProps {
  targetId: number;
  targetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CopyButton({ value }: { value: string }) {
  return (
    <button type="button" onClick={() => { void navigator.clipboard?.writeText(value); toast.success("Copied"); }} className="p-2 rounded-lg text-muted-foreground hover:text-foreground" aria-label="Copy">
      <Copy className="w-4 h-4" />
    </button>
  );
}

export default function PaymentModal({ targetId, targetName, onClose, onSuccess }: PaymentModalProps) {
  const [provider, setProvider] = useState<Provider>("mtn");
  const [transactionId, setTransactionId] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const configuration = trpc.payment.configuration.useQuery();
  const initiate = trpc.payment.initiate.useMutation();
  const config = configuration.data;
  const availableProviders = useMemo<Provider[]>(() => {
    if (!config) return [];
    return (["mtn", "airtel", "bank"] as Provider[]).filter((method) => config.methods[method]);
  }, [config]);

  useEffect(() => {
    if (availableProviders.length > 0 && !availableProviders.includes(provider)) setProvider(availableProviders[0]);
  }, [availableProviders, provider]);

  const details = config?.details ?? {};
  const providerInfo = provider === "mtn"
    ? { label: "MTN Money", number: details.payment_mtn_number, name: details.payment_mtn_name, instructions: details.payment_mtn_instructions, reference: details.payment_mtn_reference }
    : provider === "airtel"
      ? { label: "Airtel Money", number: details.payment_airtel_number, name: details.payment_airtel_name, instructions: details.payment_airtel_instructions, reference: details.payment_airtel_reference }
      : { label: "Bank Transfer", number: details.payment_bank_account_number, name: details.payment_bank_account_name, instructions: details.payment_bank_instructions, reference: details.payment_bank_reference };

  const handleSubmit = async () => {
    if (!transactionId.trim()) { toast.error("Enter the transaction ID or bank reference"); return; }
    try {
      await initiate.mutateAsync({ targetId, provider, transactionId: transactionId.trim(), senderPhone: senderPhone.trim() || undefined, senderName: senderName.trim() || undefined });
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Payment submission failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Unlock Chat</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted" aria-label="Close"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-amber-500 mx-auto mb-3" />
            <p className="text-xl font-bold text-foreground">Payment Submitted</p>
            <p className="text-muted-foreground text-sm mt-2">Reference received for {targetName}. Chat remains locked until Finance verifies your payment.</p>
            <Button className="w-full h-12 mt-6 rounded-xl" onClick={() => { onSuccess(); onClose(); }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 text-center">
              <p className="text-muted-foreground text-sm">Unlock chat with</p>
              <p className="font-bold text-foreground text-lg">{targetName}</p>
              <p className="text-3xl font-bold text-primary mt-1">{config ? `${config.currency} ${config.amount}` : "K20"}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time payment · Permanent access after verification</p>
            </div>

            {configuration.isLoading ? <div className="py-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div> : availableProviders.length === 0 ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">Payment methods are not configured yet. Please try again later or contact support.</div>
            ) : (
              <>
                <Label className="text-sm font-medium mb-2 block">1. Select payment method</Label>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {availableProviders.map((method) => (
                    <button key={method} onClick={() => setProvider(method)} className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${provider === method ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                      <span className="text-xl">{method === "mtn" ? "🟡" : method === "airtel" ? "🔴" : "🏦"}</span>
                      <span className="text-xs font-medium text-foreground">{method === "mtn" ? "MTN Money" : method === "airtel" ? "Airtel Money" : "Bank Transfer"}</span>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-muted/50 border border-border p-4 mb-5">
                  <p className="font-semibold text-foreground mb-2">2. Send money</p>
                  <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Recipient</span><span className="font-medium">{providerInfo.name || "Not configured"}</span></div>
                  <div className="flex justify-between items-center text-sm mt-2"><span className="text-muted-foreground">{provider === "bank" ? "Account number" : "Phone number"}</span><span className="flex items-center font-medium">{providerInfo.number || "Not configured"}{providerInfo.number && <CopyButton value={providerInfo.number} />}</span></div>
                  {providerInfo.reference && <div className="flex justify-between items-center text-sm mt-2"><span className="text-muted-foreground">Reference</span><span className="flex items-center font-medium">{providerInfo.reference}<CopyButton value={providerInfo.reference} /></span></div>}
                  <p className="text-xs text-muted-foreground mt-3 whitespace-pre-line">{providerInfo.instructions || "Complete the payment externally, then submit the transaction reference below."}</p>
                </div>

                <p className="font-semibold text-foreground mb-2">3. Submit for verification</p>
                <div className="space-y-3 mb-5">
                  <div><Label htmlFor="transactionId">Transaction ID / bank reference</Label><Input id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter the reference from your receipt" className="mt-1 h-12" /></div>
                  {provider !== "bank" && <div><Label htmlFor="senderPhone">Sender mobile number (optional)</Label><div className="relative mt-1"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="senderPhone" type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="097 XXX XXXX" className="pl-10 h-12" /></div></div>}
                  <div><Label htmlFor="senderName">Sender/account name (optional)</Label><Input id="senderName" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Name used for payment" className="mt-1 h-12" /></div>
                </div>
                <Button className="w-full h-12 text-base rounded-xl" onClick={handleSubmit} disabled={initiate.isPending || availableProviders.length === 0}>{initiate.isPending ? "Submitting..." : "Submit Payment for Verification"}</Button>
                <p className="text-xs text-muted-foreground text-center mt-3">Your chat stays locked until a Finance Admin verifies the payment. A transaction ID alone is not proof of payment.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
