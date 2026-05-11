"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle,
  DollarSign,
  ListChecks,
  Sparkles,
  Star,
  XCircle,
} from "lucide-react";
import { markReadAction } from "@/actions/notifications";
import type { TempNotificationRow } from "@/types/notifications";
import { formatRelativeTime } from "@/lib/format-relative-time";

type Props = {
  item: TempNotificationRow;
  onUpdated: () => void;
};

function typeVisual(type: string) {
  switch (type) {
    case "submission_approved":
      return {
        circle: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
        icon: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
      };
    case "submission_rejected":
      return {
        circle: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
        icon: <XCircle className="h-5 w-5" aria-hidden="true" />,
      };
    case "bonus_received":
      return {
        circle: "bg-[#FFF5D8] text-[var(--color-gold)]",
        icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
      };
    case "payout_processed":
      return {
        circle: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
        icon: <DollarSign className="h-5 w-5" aria-hidden="true" />,
      };
    case "level_changed":
      return {
        circle: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
        icon: <Star className="h-5 w-5" aria-hidden="true" />,
      };
    case "targets_changed":
      return {
        circle: "bg-[var(--color-cream-tint)] text-[var(--color-ink)]",
        icon: <ListChecks className="h-5 w-5" aria-hidden="true" />,
      };
    default:
      return {
        circle: "bg-[var(--color-cream-tint)] text-[var(--color-muted)]",
        icon: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
      };
  }
}

export function NotificationItem({ item, onUpdated }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const visual = typeVisual(item.type);
  const isUnread = !item.is_read;

  function markReadThenNavigate(route: string | null) {
    startTransition(async () => {
      if (!item.is_read) {
        await markReadAction(item.id);
        onUpdated();
      }
      if (route) router.push(route);
    });
  }

  return (
    <div
      className={[
        "group flex items-start gap-1 rounded-xl px-2 py-2 transition-colors",
        isUnread ? "bg-[var(--color-cream-tint)]" : "bg-transparent",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={`Open notification: ${item.title}`}
        className="flex min-w-0 flex-1 cursor-pointer gap-3 rounded-lg py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        onClick={() => markReadThenNavigate(item.action_route)}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.circle}`}
          aria-hidden="true"
        >
          {visual.icon}
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <p className="text-[13px] font-bold leading-snug text-[var(--color-ink)]">{item.title}</p>
          <p className="mt-0.5 line-clamp-2 text-[12px] font-normal leading-snug text-[var(--color-muted)]">
            {item.body}
          </p>
          <p className="mt-1 text-[11px] font-normal text-[var(--color-muted)]">
            {formatRelativeTime(item.created_at)}
          </p>
        </div>
      </button>

      {isUnread ? (
        <button
          type="button"
          aria-label="Mark this notification as read"
          disabled={pending}
          onClick={(e) => {
            e.stopPropagation();
            startTransition(async () => {
              await markReadAction(item.id);
              onUpdated();
            });
          }}
          className="mt-1 shrink-0 cursor-pointer rounded-lg p-1.5 text-[var(--color-muted)] opacity-100 outline-none hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] md:opacity-0 md:group-hover:opacity-100"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
