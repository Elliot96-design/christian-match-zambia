import { ArrowLeft, Lock } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { LOGO_URL } from "@/components/AppHeader";
import { readableAuthError } from "@/lib/auth-errors";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(useSearch()).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const reset = trpc.auth.resetPassword.useMutation({ onSuccess: () => setDone(true), onError: (err) => setError(readableAuthError(err, "login")) });

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto px-5 py-6">
      <button onClick={() => navigate("/login")} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100" aria-label="Back"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
      <div className="flex flex-col items-center mt-8">
        <img src={LOGO_URL} alt="Faithful Hearts" className="w-16 h-16 rounded-2xl shadow-lg" />
        <h1 className="font-display font-bold text-xl text-primary mt-3">Choose a New Password</h1>
      </div>
      {done ? (
        <div className="mt-8 text-center space-y-4"><p className="text-green-700 text-sm">Your password has been reset successfully.</p><button onClick={() => navigate("/login")} className="btn-purple w-full font-bold" style={{ height: "52px", borderRadius: "16px" }}>Return to Log In</button></div>
      ) : (
        <div className="mt-8 space-y-3">
          <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-2xl border border-border pl-11 pr-4 text-sm" style={{ height: "52px" }} /></div>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-2xl border border-border px-4 text-sm" style={{ height: "52px" }} />
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <button disabled={reset.isPending} onClick={() => { setError(""); if (token.length < 32) return setError("This reset link is invalid or incomplete."); if (password.length < 8) return setError("Password must be at least 8 characters."); if (password !== confirm) return setError("Passwords do not match."); reset.mutate({ token, password }); }} className="btn-purple w-full font-bold" style={{ height: "52px", borderRadius: "16px" }}>{reset.isPending ? "Saving…" : "Reset Password"}</button>
        </div>
      )}
    </div>
  );
}
