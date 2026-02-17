"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-[#333333] hover:text-[#0B4F6C]"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0B4F6C] px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
          <h3 className="text-sm font-semibold text-[#333333] font-[family-name:var(--font-inter)]">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#E8F4F8] px-2 py-0.5 text-[11px] font-medium text-[#0B4F6C]">
              {unreadCount} new
            </span>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-[#333333]/60 font-[family-name:var(--font-inter)]">
                Loading...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="mb-2 size-5 text-[#333333]/30" />
              <p className="text-sm text-[#333333]/60 font-[family-name:var(--font-inter)]">
                No notifications yet
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <button
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-colors hover:bg-[#F9F9F9]",
                      !notification.read && "bg-[#E8F4F8]/30"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0B4F6C]" />
                      )}
                      <div className={cn(!notification.read ? "" : "pl-4")}>
                        <p className="text-sm font-medium text-[#333333] font-[family-name:var(--font-inter)]">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#333333]/70 font-[family-name:var(--font-inter)] line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="mt-1 text-[11px] text-[#333333]/50 font-[family-name:var(--font-inter)]">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                  {index < notifications.length - 1 && (
                    <Separator className="bg-[#E2E8F0]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
