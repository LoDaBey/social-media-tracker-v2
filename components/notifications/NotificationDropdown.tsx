"use client";

import { useTransition } from "react";
import { markAllReadAction } from "@/actions/notifications";
import type { NotificationDropdownProps } from "@/types/notifications";
import { NotificationItem } from "./NotificationItem";

export function NotificationDropdown({
  items,
  unreadCount,
  onClose,
  onRefresh,
  placement,
}: NotificationDropdownProps) {
  const [pending, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      await markAllReadAction();
      onRefresh();
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/50 md:bg-transparent"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="fixed z-[90] flex max-h-[70vh] flex-col overflow-hidden rounded-b-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] shadow-[0_12px_32px_rgba(20,20,20,.12)] max-md:inset-x-0 max-md:top-16 md:max-h-[min(420px,calc(100dvh-5rem))] md:w-[380px] md:rounded-2xl"
        style={
          placement
            ? { top: placement.top, right: placement.right }
            : undefined
        }
        role="dialog"
        aria-label="Notifications panel"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-hairline)] px-4 py-3">
          <h2 className="text-[16px] font-bold text-[var(--color-ink)]">Notifications</h2>
          <button
            type="button"
            onClick={markAll}
            disabled={unreadCount === 0 || pending}
            aria-label="Mark all notifications as read"
            className="cursor-pointer rounded-lg px-2 py-1 text-[12px] font-semibold text-[var(--color-emerald)] outline-none hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Mark all read
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {items.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] font-medium text-[var(--color-muted)]">
              No notifications yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationItem item={item} onUpdated={onRefresh} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
