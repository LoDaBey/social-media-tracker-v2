"use client";

import { adminRoleBadge } from "@/lib/admin-view";
import { EmployeeCountryCell } from "@/components/admin/EmployeeCountryCell";
import { EmployeeActiveToggle } from "@/components/admin/EmployeeActiveToggle";
import { EmployeeDeleteButton } from "@/components/admin/EmployeeDeleteButton";
import { EmployeeViewButton } from "@/components/admin/EmployeeViewButton";
import type { AdminEmployeeListRow, EmployeeTableRowProps } from "@/types/admin";

const cycleLabel: Record<AdminEmployeeListRow["cycle_status"], string> = {
  pending: "Pending",
  "mid-cycle": "Mid-cycle",
  payable: "Payable",
};

export function EmployeeTableRow({ row }: EmployeeTableRowProps) {
  const initial = (row.full_name.trim()[0] ?? "?").toUpperCase();

  return (
    <tr
      className={`border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)] hover:bg-[var(--color-emerald-tint)]/40 ${
        row.is_active ? "" : "opacity-70"
      }`}
    >
      <td className="px-4 py-3 align-top">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[14px] font-bold text-[var(--color-ink)]"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--color-ink)]">
              {row.full_name}
            </p>
            <p className="truncate text-[13px] text-[var(--color-muted)]">{row.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <EmployeeCountryCell countries={row.countries} />
      </td>
      <td className="px-4 py-3 text-[14px] text-[var(--color-ink)]">
        {adminRoleBadge(row.role)}
      </td>
      <td className="px-4 py-3 text-[14px] text-[var(--color-ink)]">
        {row.team_lead_name ?? "—"}
      </td>
      <td className="px-4 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
        {row.current_level}
      </td>
      <td className="px-4 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
        {row.target_accounts_sum}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex rounded-full bg-[var(--color-cream-tint)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-ink)]">
          {cycleLabel[row.cycle_status]}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <EmployeeViewButton
            employeeId={row.id}
            fullName={row.full_name}
            role={row.role}
          />
          <EmployeeDeleteButton userId={row.id} fullName={row.full_name} />
          <EmployeeActiveToggle
            userId={row.id}
            fullName={row.full_name}
            isActive={row.is_active}
          />
        </div>
      </td>
    </tr>
  );
}
