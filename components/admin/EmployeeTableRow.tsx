"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { adminRoleBadge } from "@/lib/admin-view";
import { EmployeeCountryCell } from "@/components/admin/EmployeeCountryCell";
import { EmployeeActiveToggle } from "@/components/admin/EmployeeActiveToggle";
import { EmployeeDeleteButton } from "@/components/admin/EmployeeDeleteButton";
import { EmployeeViewButton } from "@/components/admin/EmployeeViewButton";
import { EmployeeAccountsPanel } from "@/components/admin/EmployeeAccountsPanel";
import { AccountTotalsCell } from "@/components/admin/AccountTotalsCell";
import type { AdminEmployeeListRow, EmployeeTableRowProps } from "@/types/admin";

const cycleLabel: Record<AdminEmployeeListRow["cycle_status"], string> = {
  pending: "Pending",
  "mid-cycle": "Mid-cycle",
  payable: "Payable",
};

export function EmployeeTableRow({ row }: EmployeeTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const initial = (row.full_name.trim()[0] ?? "?").toUpperCase();
  const canExpand = row.role === "employee";
  const panelId = `employee-accounts-${row.id}`;

  function toggle() {
    if (!canExpand) return;
    setExpanded((prev) => !prev);
  }

  return (
    <>
      <tr
        className={`border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)] hover:bg-[var(--color-emerald-tint)]/40 ${
          row.is_active ? "" : "opacity-70"
        } ${canExpand ? "cursor-pointer" : ""}`}
        onClick={canExpand ? toggle : undefined}
      >
        <td className="px-4 py-3 align-top">
          <div className="flex items-start gap-3">
            {canExpand ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={
                  expanded
                    ? `Hide accounts for ${row.full_name}`
                    : `Show accounts for ${row.full_name}`
                }
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                className="mt-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <span className="mt-1 inline-flex h-8 w-8 shrink-0" aria-hidden="true" />
            )}
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
              <p className="truncate text-[13px] text-[var(--color-muted)]">
                {row.email}
              </p>
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
          <AccountTotalsCell
            added={row.accounts.length}
            assigned={row.target_accounts_sum}
          />
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex rounded-full bg-[var(--color-cream-tint)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-ink)]">
            {cycleLabel[row.cycle_status]}
          </span>
        </td>
        <td className="px-4 py-3">
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
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
      {canExpand && expanded ? (
        <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/70">
          <td
            colSpan={9}
            className="px-4 py-4"
            id={panelId}
            onClick={(e) => e.stopPropagation()}
          >
            <EmployeeAccountsPanel
              userId={row.id}
              fullName={row.full_name}
              accounts={row.accounts}
              assignedCount={row.target_accounts_sum}
              canAdd
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
