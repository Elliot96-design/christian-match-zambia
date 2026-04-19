import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, User, Users, Shield } from "lucide-react";
import { useLocation } from "wouter";

type NavItem = "browse" | "profile" | "admin";

export default function BottomNav({ active }: { active: NavItem }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const items = [
    { id: "browse" as NavItem, label: "Browse", icon: Users, path: "/browse" },
    { id: "profile" as NavItem, label: "My Profile", icon: User, path: "/edit-profile" },
    ...(user?.role === "admin" ? [{ id: "admin" as NavItem, label: "Admin", icon: Shield, path: "/admin" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2 max-w-[480px] mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors min-w-[64px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
