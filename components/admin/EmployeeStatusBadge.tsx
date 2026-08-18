import type { EmployeeStatusBadgeProps } from "@/types/admin";
import { employmentStatusLabel } from "@/lib/employment-status";

const toneClass: Record<EmployeeStatusBadgeProps["status"], string> = {
  active: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
  on_hold: "bg-[#E08A2C]/15 text-[#E08A2C]",
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
