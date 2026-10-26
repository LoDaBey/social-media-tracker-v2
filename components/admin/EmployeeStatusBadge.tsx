import type { EmployeeStatusBadgeProps } from "@/types/admin";
import { employmentStatusLabel } from "@/lib/employment-status";

const toneClass: Record<EmployeeStatusBadgeProps["status"], string> = {
  active: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
  on_hold: "bg-[var(--color-amber)]/15 text-[var(--color-amber)]",
  deactivated: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
};

export function EmployeeStatusBadge({ status }: EmployeeStatusBadgeProps) {
  const label = employmentStatusLabel(status);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${toneClass[status]}`}
      aria-label={`Employment status: ${label}`}
    >
      {label}
    </span>
  );
}
