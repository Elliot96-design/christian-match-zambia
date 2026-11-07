import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle, Loader2, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { CHAT_UNLOCK_ZMW, formatPrice, isZambiaLocation } from "@/lib/pricing";

type Provider = "mtn" | "airtel" | "visa";

interface PaymentModalProps {
  targetId: number;
  targetName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ targetId, targetName, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const { data: fx } = trpc.pricing.exchangeRate.useQuery();
  const isZambia = isZambiaLocation(user?.location);
  const [provider, setProvider] = useState<Provider>(isZambia ? "mtn" : "visa");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "processing" | "success">("select");

  const initiate = trpc.payment.initiate.useMutation();
  const confirm = trpc.payment.confirm.useMutation();

  useEffect(() => {
    setProvider(isZambia ? "mtn" : "visa");
  }, [isZambia]);

  const handlePay = async () => {
    if (provider === "visa" && (cardNumber.replace(/\s/g, "").length < 12 || !/^\d{2}\/\d{2}$/.test(cardExpiry) || cardCvc.length < 3)) {
      toast.error("Enter valid card details before continuing");
      return;
    }
    if (!phone && provider !== "visa") {
      toast.error("Please enter your mobile money number");
      return;
    }
    setStep("processing");
    try {
      const { paymentId } = await initiate.mutateAsync({ targetId, provider, phone });
      // Allow the provider confirmation request to settle before refreshing access.
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
              <p className="text-3xl font-bold text-primary mt-1">{formatPrice(CHAT_UNLOCK_ZMW, user?.location, fx?.zmwPerUsd)}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time payment · Permanent access</p>
            </div>

            {/* Provider selection */}
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Payment Method</Label>
              <div className={`grid ${isZambia ? "grid-cols-3" : "grid-cols-1"} gap-2`}>
                {(isZambia ? [
                  { id: "mtn" as Provider, label: "MTN Money", color: "bg-yellow-400", emoji: "🟡" },
                  { id: "airtel" as Provider, label: "Airtel Money", color: "bg-red-500", emoji: "🔴" },
                  { id: "visa" as Provider, label: "Bank card · Visa / Mastercard / Credit card", color: "bg-blue-800", emoji: "💳" },
                ] : [
                  { id: "visa" as Provider, label: "Bank card · Visa / Mastercard / Credit card", color: "bg-blue-800", emoji: "💳" },
                ]).map((p) => (
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
            {provider !== "visa" && (
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

            {provider === "visa" && (
              <div className="mb-5 space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-foreground">Secure bank-card details</p>
                <Input aria-label="Card number" inputMode="numeric" autoComplete="cc-number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, "").slice(0, 19))} placeholder="Card number" />
                <div className="grid grid-cols-2 gap-3">
                  <Input aria-label="Card expiry" inputMode="numeric" autoComplete="cc-exp" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value.replace(/[^0-9/]/g, "").slice(0, 5))} placeholder="MM/YY" />
                  <Input aria-label="Card security code" inputMode="numeric" autoComplete="cc-csc" type="password" value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="CVC" />
                </div>
                <p className="text-[11px] text-muted-foreground">Card details stay in this secure form and are never stored or sent to Faithful Hearts. Connect a PCI-compliant card gateway before charging live cards.</p>
              </div>
            )}

            <Button
              className="w-full h-12 text-base rounded-xl"
              onClick={handlePay}
              disabled={initiate.isPending || confirm.isPending}
            >
              Pay {formatPrice(CHAT_UNLOCK_ZMW, user?.location, fx?.zmwPerUsd)} with {provider === "mtn" ? "MTN Money" : provider === "airtel" ? "Airtel Money" : "Bank card"}
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
