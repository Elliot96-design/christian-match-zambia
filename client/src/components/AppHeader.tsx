import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowLeft, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export const LOGO_URL = "/faithful-hearts-logo.svg";

interface AppHeaderProps {
  /** Show a back arrow that navigates to this path */
  backTo?: string;
  /** Show the sign-out button on the right */
  showSignOut?: boolean;
  /** Replace logo with a text title in the centre */
  title?: string;
  /** Arbitrary right-side slot (overrides showSignOut) */
  rightSlot?: React.ReactNode;
}

export default function AppHeader({ backTo, showSignOut, title, rightSlot }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { logout } = useAuth();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else window.history.back();
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
    toast.success("Signed out successfully");
  };

  return (
    <header className="sticky top-0 z-20 hero-gradient">
      <div className="flex items-center h-14 px-3 gap-2">
        {/* Left: back button or spacer */}
        <div className="w-10 flex-shrink-0">
          {backTo !== undefined ? (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 active:bg-white/25 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          ) : null}
        </div>

        {/* Centre: logo + brand name or custom title */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <img
            src={LOGO_URL}
            alt="Faithful Hearts"
            className="h-8 w-8 rounded-xl object-cover shadow-sm"
            loading="eager"
          />
          {title ? (
            <span className="font-display font-bold text-white text-base">{title}</span>
          ) : (
            <span className="font-display font-bold text-white text-base">Faithful Hearts</span>
          )}
        </div>

        {/* Right: custom slot, sign-out, or spacer */}
        <div className="w-10 flex-shrink-0 flex justify-end">
          {rightSlot !== undefined ? (
            rightSlot
          ) : showSignOut ? (
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="text-white/70 text-xs font-medium"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
