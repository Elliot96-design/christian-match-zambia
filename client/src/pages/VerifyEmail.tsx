import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(useSearch()).get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const verify = trpc.auth.verifyEmail.useMutation({ onSuccess: () => setStatus("success"), onError: () => setStatus("error") });

  useEffect(() => {
    if (token.length < 32) { setStatus("error"); return; }
    verify.mutate({ token });
  }, [token]);

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto flex items-center justify-center px-6 text-center">
      <div className="space-y-4">
        {status === "loading" && <div className="w-10 h-10 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />}
        {status === "success" ? <CheckCircle2 className="w-14 h-14 mx-auto text-green-600" /> : status === "error" ? <XCircle className="w-14 h-14 mx-auto text-red-600" /> : null}
        <h1 className="font-display font-bold text-2xl text-primary">{status === "success" ? "Email Verified" : status === "error" ? "Link Invalid or Expired" : "Verifying Email…"}</h1>
        <p className="text-sm text-muted-foreground">{status === "success" ? "Your Faithful Hearts account is now verified." : status === "error" ? "Request a new verification link from your account or sign in again." : "Please wait while we verify your email address."}</p>
        {status !== "loading" && <button onClick={() => navigate("/login")} className="btn-purple w-full font-bold" style={{ height: "52px", borderRadius: "16px" }}>Continue to Log In</button>}
      </div>
    </div>
  );
}
