"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type {
  NotificationDropdownPlacement,
  NotificationsApiResponse,
} from "@/types/notifications";
import { NotificationDropdown } from "./NotificationDropdown";

function formatBadge(n: number) {
  if (n > 99) return "99+";
  return String(n);
}

async function fetchNotifications(): Promise<NotificationsApiResponse | null> {
  try {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as NotificationsApiResponse;
  } catch {
    return null;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NotificationsApiResponse | null>(null);
  const [placement, setPlacement] = useState<NotificationDropdownPlacement | null>(
    null
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  function refresh() {
    void (async () => {
      const json = await fetchNotifications();
      if (json) setData(json);
    })();
  }

  function measurePlacement(): NotificationDropdownPlacement | null {
    const el = wrapRef.current;
    if (!el || window.innerWidth < 768) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: Math.round(rect.bottom + 8),
      right: Math.round(window.innerWidth - rect.right),
    };
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const json = await fetchNotifications();
      if (!cancelled && json) setData(json);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void (async () => {
        const json = await fetchNotifications();
        if (json) setData(json);
      })();
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;

    function updatePlacement() {
      const el = wrapRef.current;
      if (!el || window.innerWidth < 768) {
        setPlacement(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setPlacement({
        top: Math.round(rect.bottom + 8),
        right: Math.round(window.innerWidth - rect.right),
      });
    }

    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            setPlacement(next ? measurePlacement() : null);
            return next;
          });
          refresh();
        }}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Open notifications"
        }
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none transition-colors hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <Bell className="h-[22px] w-[22px]" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-coral)] px-1 text-[10px] font-bold leading-none text-white tabular-nums"
            aria-hidden="true"
          >
            {formatBadge(unreadCount)}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationDropdown
          items={items}
          unreadCount={unreadCount}
          placement={placement}
          onClose={() => {
            setOpen(false);
            refresh();
          }}
          onRefresh={refresh}
        />
      ) : null}
    </div>
  );
}
