function formatCairoDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DateBadge() {
  return (
    <span className="rounded-full bg-[var(--color-cream-tint)] px-3 py-1 text-[12px] font-medium text-[var(--color-muted)] tabular-nums">
      {formatCairoDate()}
    </span>
  );
}
