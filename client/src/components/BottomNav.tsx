import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Heart, MessageCircle, User, Users } from "lucide-react";
import { useLocation } from "wouter";

export type NavTab = "home" | "swipe" | "chat" | "profile" | "chatroom";

export default function BottomNav({ active }: { active: NavTab }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const items: { id: NavTab; label: string; icon: React.ElementType; path: string }[] = [
    { id: "home",     label: "Home",     icon: Home,          path: "/browse" },
    { id: "swipe",    label: "Swipe",    icon: Heart,         path: "/browse?tab=swipe" },
    { id: "chat",     label: "Chat",     icon: MessageCircle, path: "/browse?tab=chat" },
    { id: "profile",  label: "Profile",  icon: User,          path: "/edit-profile" },
    { id: "chatroom", label: "Chatroom", icon: Users,         path: "/browse?tab=chatroom" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 safe-area-pb"
      style={{ background: "oklch(0.22 0.18 290)", borderTop: "1px solid oklch(0.30 0.18 290)" }}
    >
      <div className="flex items-center justify-around px-1 py-2 max-w-[480px] mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl min-w-[52px] transition-all"
              aria-label={item.label}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: isActive ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.08 290)" }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: isActive ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.08 290)" }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ background: "oklch(0.72 0.16 80)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
