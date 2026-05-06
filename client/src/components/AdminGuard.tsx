import { useEffect, useState } from "react";
import { useLocation } from "wouter";

/**
 * AdminGuard — wraps all /admin/* panel routes.
 * Checks localStorage for a valid admin session token.
 * If not present, redirects to /admin-portal.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminSessionToken");
    const expiry = localStorage.getItem("adminSessionExpiry");
    const now = Date.now();
    if (token && expiry && parseInt(expiry) > now) {
      setAllowed(true);
    } else {
      // Clear stale tokens
      localStorage.removeItem("adminSessionToken");
      localStorage.removeItem("adminSessionExpiry");
      localStorage.removeItem("adminPanel");
      navigate("/admin-portal");
    }
    setChecked(true);
  }, [navigate]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0520" }}>
        <div className="text-white/60 text-sm">Verifying access...</div>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
