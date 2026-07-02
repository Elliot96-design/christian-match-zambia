import { Bell, Heart, MessageCircle, Crown, Eye, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Notification } from "@shared/types";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications
  const { data: notificationsData, refetch } = trpc.notification.list.useQuery(
    undefined,
    { enabled: isOpen }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const notifications = notificationsData?.notifications ?? [];
  const unreadCount = notifications.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-400" />;
      case "message":
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      case "premium_reminder":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case "premium_expired":
        return <Crown className="w-4 h-4 text-gray-400" />;
      case "view":
        return <Eye className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "like":
        return "bg-red-500/10 border-red-500/20";
      case "message":
        return "bg-blue-500/10 border-blue-500/20";
      case "premium_reminder":
      case "premium_expired":
        return "bg-yellow-500/10 border-yellow-500/20";
      case "view":
        return "bg-purple-500/10 border-purple-500/20";
      default:
        return "bg-white/5 border-white/10";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-yellow-400 text-primary text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-[#1a0f2e] border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          style={{ backdropFilter: "blur(10px)" }}
        >
          {/* Header */}
          <div className="sticky top-0 px-4 py-3 border-b border-white/10 bg-[#1a0f2e]/95">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-white/60 text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif: Notification) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    markAsRead.mutate({ notificationId: notif.id });
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-yellow-400 ${getNotificationColor(
                    notif.type
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm line-clamp-2">
                        {notif.title}
                      </p>
                      <p className="text-white/60 text-xs mt-1 line-clamp-2">
                        {notif.content}
                      </p>
                      <p className="text-white/40 text-[10px] mt-1.5">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
