import { useLocation } from "wouter";

export type NavTab = "home" | "swipe" | "chat" | "profile" | "chatroom" | "notifications" | "messages";

interface BottomNavProps {
  active: NavTab;
  onTabChange?: (tab: NavTab) => void;
  notificationCount?: number;
}

const NAV_ITEMS: { tab: NavTab; label: string; path: string; icon: React.ReactNode }[] = [
  {
    tab: "home",
    label: "Home",
    path: "/browse",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    tab: "swipe",
    label: "Discover",
    path: "/browse?tab=swipe",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    tab: "chatroom",
    label: "Chatroom",
    path: "/chatroom",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
      </svg>
    ),
  },
  {
    tab: "messages",
    label: "Messages",
    path: "/browse?tab=messages",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    tab: "profile",
    label: "Profile",
    path: "/browse?tab=profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export default function BottomNav({ active, onTabChange, notificationCount = 3 }: BottomNavProps) {
  const [, navigate] = useLocation();

  const handleTab = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.tab === "chatroom") {
      navigate("/chatroom");
      return;
    }
    if (item.tab === "messages") {
      if (onTabChange) onTabChange("chat");
      else navigate("/browse?tab=chat");
      return;
    }
    if (onTabChange) {
      onTabChange(item.tab);
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav
      className="flex-shrink-0 flex items-center justify-around px-2 py-2"
      style={{
        background: "oklch(0.22 0.18 290)",
        borderTop: "1px solid oklch(0.35 0.12 290 / 0.5)",
        paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.tab;
        return (
          <button
            key={item.tab}
            onClick={() => handleTab(item)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 relative min-w-[44px]"
            aria-label={item.label}
          >
            {/* Notification badge */}
            {item.tab === "messages" && notificationCount > 0 && (
              <span
                className="absolute -top-0.5 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "oklch(0.72 0.16 80)", color: "oklch(0.22 0.18 290)" }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
            <span style={{ color: isActive ? "oklch(0.72 0.16 80)" : "oklch(0.70 0.05 290)" }}>
              {item.icon}
            </span>
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? "oklch(0.72 0.16 80)" : "oklch(0.70 0.05 290)" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
