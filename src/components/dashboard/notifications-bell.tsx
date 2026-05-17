"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const TYPE_DOT: Record<string, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
  alert: "bg-destructive",
};

export function NotificationsBell() {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=15", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  // Initial load + 60s polling
  React.useEffect(() => {
    fetchNotifications();
    const handle = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(handle);
  }, [fetchNotifications]);

  // Refresh when opened
  React.useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  async function markAllRead() {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markOne(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // optimistic only
    }
  }

  const badge = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {badge && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground shadow ring-2 ring-background">
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[360px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            disabled={loading || unreadCount === 0}
            onClick={markAllRead}
            className="h-7 text-xs"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Check className="h-3 w-3" /> Mark all read
              </>
            )}
          </Button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                You don’t have any notifications yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Body = (
                  <>
                    <span
                      className={cn(
                        "mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full",
                        TYPE_DOT[n.type] ?? "bg-muted-foreground"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium leading-snug">
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {timeAgo(new Date(n.createdAt))}
                      </p>
                    </div>
                  </>
                );

                const baseClass = cn(
                  "flex gap-3 px-3 py-2.5 transition-colors hover:bg-accent",
                  !n.read && "bg-primary/[0.03]"
                );

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.read) markOne(n.id);
                          setOpen(false);
                        }}
                        className={baseClass}
                      >
                        {Body}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.read && markOne(n.id)}
                        className={cn(baseClass, "w-full text-left")}
                      >
                        {Body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
