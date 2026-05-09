import { trpc } from "@/lib/trpc";
import { Bell, Heart, MessageCircle } from "lucide-react";
import { NavTab } from "@/components/BottomNav";

const typeIcon: Record<string, React.ReactNode> = {
  like: <Heart className="w-5 h-5 text-pink-500" />,
  announcement: <Bell className="w-5 h-5 text-purple-500" />,
  default: <MessageCircle className="w-5 h-5 text-purple-400" />,
};

const typeBg: Record<string, string> = {
  like: "oklch(0.96 0.04 0)",
  announcement: "oklch(0.94 0.04 290)",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsTab({ onTabChange }: { onTabChange: (tab: NavTab) => void }) {
  const { data: notifications, isLoading } = trpc.home.notifications.useQuery();

  return (
    <div
      className="flex-1 overflow-y-auto pb-24"
      style={{ background: "oklch(0.97 0.008 290)" }}
    >
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 flex items-center justify-between sticky top-0 z-10"
        style={{ background: "oklch(0.97 0.008 290)", borderBottom: "1px solid oklch(0.91 0.04 290)" }}
      >
        <h2 className="font-display font-bold text-xl" style={{ color: "oklch(0.22 0.18 290)" }}>
          Notifications
        </h2>
        {notifications && notifications.length > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "oklch(0.28 0.20 290)", color: "white" }}
          >
            {notifications.length}
          </span>
        )}
      </div>

      <div className="px-4 pt-3 flex flex-col gap-3">
        {isLoading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-2xl animate-pulse"
              style={{ background: "oklch(0.93 0.04 290)" }}
            >
              <div className="w-10 h-10 rounded-full" style={{ background: "oklch(0.87 0.04 290)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded" style={{ background: "oklch(0.87 0.04 290)", width: "60%" }} />
                <div className="h-2.5 rounded" style={{ background: "oklch(0.87 0.04 290)", width: "90%" }} />
              </div>
            </div>
          ))
        ) : notifications && notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{
                background: typeBg[n.type] ?? "oklch(0.98 0.005 290)",
                border: "1px solid oklch(0.90 0.04 290)",
                boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)",
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(1 0 0 / 0.7)" }}
              >
                {typeIcon[n.type] ?? typeIcon.default}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-snug" style={{ color: "oklch(0.22 0.18 290)" }}>
                    {n.title}
                  </p>
                  <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "oklch(0.60 0.08 290)" }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "oklch(0.50 0.08 290)" }}>
                  {n.description}
                </p>

                {/* CTA for like */}
                {n.type === "like" && (
                  <button
                    onClick={() => onTabChange("messages")}
                    className="mt-2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: "oklch(0.28 0.20 290)", color: "white" }}
                  >
                    View Messages
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ background: "oklch(0.94 0.04 290)" }}
          >
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(0.70 0.10 290)" }} />
            <p className="font-semibold text-sm" style={{ color: "oklch(0.45 0.12 290)" }}>
              No notifications yet
            </p>
            <p className="text-xs mt-1" style={{ color: "oklch(0.60 0.08 290)" }}>
              When someone likes your profile or there are updates, you'll see them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
