import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2, Phone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Provider = "mtn" | "airtel" | "mock";

interface PaymentModalProps {
  targetId: number;
  targetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ targetId, targetName, onClose, onSuccess }: PaymentModalProps) {
  const [provider, setProvider] = useState<Provider>("mtn");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "success">("select");

  const initiate = trpc.payment.initiate.useMutation();
  const confirm = trpc.payment.confirm.useMutation();

  const handlePay = async () => {
    if (!phone && provider !== "mock") {
      toast.error("Please enter your mobile money number");
      return;
    }
    setStep("processing");
    try {
      const { paymentId } = await initiate.mutateAsync({ targetId, provider, phone });
      // Simulate processing delay (mock flow)
      await new Promise((r) => setTimeout(r, 2000));
      await confirm.mutateAsync({ paymentId });
      setStep("success");
      setTimeout(() => onSuccess(), 1500);
    } catch (err: unknown) {
      setStep("select");
      const message = err instanceof Error ? err.message : "Payment failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white w-full max-w-[480px] rounded-t-2xl p-6 pb-8 animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Unlock Chat</h2>
          {step !== "processing" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {step === "success" ? (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <p className="text-xl font-bold text-foreground">Payment Successful!</p>
            <p className="text-muted-foreground text-sm mt-2">
              Chat with {targetName} is now unlocked permanently.
            </p>
          </div>
        ) : step === "processing" ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
            <p className="font-semibold text-foreground">Processing Payment...</p>
            <p className="text-muted-foreground text-sm mt-2">
              Please wait while we confirm your payment.
            </p>
          </div>
        ) : (
          <>
            {/* Amount */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5 text-center">
              <p className="text-muted-foreground text-sm">Unlock chat with</p>
              <p className="font-bold text-foreground text-lg">{targetName}</p>
              <p className="text-3xl font-bold text-primary mt-1">K20</p>
              <p className="text-xs text-muted-foreground mt-1">One-time payment · Permanent access</p>
            </div>

            {/* Provider selection */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "mtn" as Provider, label: "MTN Money", color: "bg-yellow-400", emoji: "🟡" },
                  { id: "airtel" as Provider, label: "Airtel Money", color: "bg-red-500", emoji: "🔴" },
                  { id: "mock" as Provider, label: "Test Pay", color: "bg-gray-400", emoji: "🧪" },
                ] as const).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${
                      provider === p.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-white"
                    }`}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="text-xs font-medium text-foreground leading-tight text-center px-1">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone number */}
            {provider !== "mock" && (
              <div className="mb-5">
                <Label htmlFor="phone" className="text-sm font-medium">Mobile Money Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={provider === "mtn" ? "096X XXX XXX" : "097X XXX XXX"}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {provider === "mtn" ? "MTN Zambia number (096/076)" : "Airtel Zambia number (097/077)"}
                </p>
              </div>
            )}

            {provider === "mock" && (
              <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-blue-800 text-xs text-center">
                  🧪 Test mode — payment will be simulated instantly. No real money charged.
                </p>
              </div>
            )}

            <Button
              className="w-full h-12 text-base rounded-xl"
              onClick={handlePay}
              disabled={initiate.isPending || confirm.isPending}
            >
              Pay K20 with {provider === "mtn" ? "MTN Money" : provider === "airtel" ? "Airtel Money" : "Test"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Secure payment · Your chat unlocks immediately after payment
            </p>
          </>
        )}
      </div>
    </div>
  );
}
