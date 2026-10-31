import type { DateBadgeProps } from "@/types/layout";

function formatCairoDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DateBadge({ variant = "pill" }: DateBadgeProps) {
  const label = formatCairoDate();

  if (variant === "plain") {
    return (
      <span className="hidden text-[13px] font-medium text-[var(--color-muted)] tabular-nums sm:inline">
        {label}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-[var(--color-cream-tint)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)] tabular-nums">
      {label}
    </span>
  );
}
