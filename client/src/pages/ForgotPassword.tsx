import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import { readableAuthError } from "@/lib/auth-errors";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => setMessage(data.message),
    onError: (err) => setError(readableAuthError(err, "login")),
  });

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto px-5 py-6">
      <button onClick={() => navigate("/login")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back">
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      <div className="flex flex-col items-center mt-8">
        <img src={LOGO_URL} alt="Faithful Hearts" className="w-16 h-16 rounded-2xl shadow-lg" />
        <h1 className="font-display font-bold text-xl text-primary mt-3">Reset Password</h1>
        <p className="text-muted-foreground text-sm text-center mt-2">Enter your email and we’ll send reset instructions if an account exists.</p>
      </div>
      <div className="mt-8 space-y-3">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full h-13 rounded-2xl border border-border pl-11 pr-4 text-sm" style={{ height: "52px" }} />
        </div>
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        {message && <p className="text-xs text-green-700 text-center">{message}</p>}
        <button disabled={request.isPending} onClick={() => { setError(""); setMessage(""); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; } request.mutate({ email: email.trim().toLowerCase() }); }} className="btn-purple w-full font-bold" style={{ height: "52px", borderRadius: "16px" }}>
          {request.isPending ? "Sending…" : "Send Reset Link"}
        </button>
      </div>
    </div>
  );
}
