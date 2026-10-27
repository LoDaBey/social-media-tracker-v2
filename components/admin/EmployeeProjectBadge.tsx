import type { EmployeeProjectBadgeProps } from "@/types/admin";

export function EmployeeProjectBadge({ label }: EmployeeProjectBadgeProps) {
  return (
    <span className="rounded-full bg-[var(--color-cream-tint)] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {label}
    </span>
  );
}
