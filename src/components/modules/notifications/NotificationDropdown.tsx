"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Info,
  Loader2,
  Repeat,
  Sparkles,
  X,
} from "lucide-react";
import { type AppNotification, type NotificationType } from "@/types/finance";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/actions/notifications";
import { formatDate } from "@/lib/utils";

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "budget_warning":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    case "recurring_due":
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Repeat className="w-4 h-4" />
        </div>
      );
    case "goal_reached":
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
          <Info className="w-4 h-4" />
        </div>
      );
  }
}

export function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchItems = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await getNotifications();
        if (isMounted) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const timer = setTimeout(load, 0);
    const interval = setInterval(load, 60000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      fetchItems().finally(() => setIsLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-100 active:scale-[0.95] relative"
        aria-label="Notifikasi"
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in-50 duration-150">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[80vh] sm:max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Notifikasi & Peringatan
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  disabled={isMarkingAll}
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Semua Beres!
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs">
                  Tidak ada peringatan anggaran atau tagihan jatuh tempo saat ini.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                    !n.is_read ? "bg-emerald-500/5 dark:bg-emerald-500/[0.03]" : ""
                  }`}
                >
                  {getNotificationIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !n.is_read
                            ? "font-bold text-zinc-900 dark:text-zinc-100"
                            : "font-medium text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {formatDate(n.created_at, "d MMM, HH:mm")}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                  {n.link && (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
