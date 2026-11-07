import type { EmployeeProjectCellProps } from "@/types/admin";

export function EmployeeProjectCell({ project }: EmployeeProjectCellProps) {
  if (!project) {
    return <span className="text-[14px] text-[var(--color-muted)]">—</span>;
  }

  return (
    <span className="text-[14px] font-semibold text-[var(--color-ink)]">
      {project}
    </span>
  );
}
