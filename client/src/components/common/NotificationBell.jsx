import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import { useFirestoreNotifications } from "../../hooks/useFirestoreNotifications.js";

function notificationTime(notification) {
  const date = notification.createdAt?.toDate
    ? notification.createdAt.toDate()
    : notification.createdAt?.seconds
      ? new Date(notification.createdAt.seconds * 1000)
      : null;

  return date ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now";
}

export function NotificationBell({ targetRole, targetUserId = "" }) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useFirestoreNotifications({ targetRole, targetUserId });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 transition hover:border-captain-gold hover:text-white"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 font-mono text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-24px)] rounded-lg border border-captain-gold/25 bg-captain-charcoal p-2 shadow-gold-strong">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 px-2 pb-2 font-nav text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/50">
            <span>Notifications ({unreadCount})</span>
            {unreadCount ? (
              <button type="button" onClick={markAllAsRead} className="text-captain-bright hover:underline">
                Mark all
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">No notifications yet.</div>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-2.5 transition ${
                    notification.isRead ? "border-white/5 opacity-60" : "border-captain-gold/15 bg-captain-gold/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-white">{notification.title}</span>
                    <span className="shrink-0 text-[10px] text-white/40">{notificationTime(notification)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/70">{notification.message}</p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    {notification.link ? (
                      <Link
                        to={notification.link}
                        onClick={async () => {
                          await markAsRead(notification.id);
                          setOpen(false);
                        }}
                        className="rounded bg-captain-gold/20 px-2 py-1 font-nav text-[10px] font-extrabold uppercase tracking-[0.12em] text-captain-bright hover:bg-captain-gold/30"
                      >
                        View
                      </Link>
                    ) : (
                      <span />
                    )}
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="text-white/40 hover:text-white"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
