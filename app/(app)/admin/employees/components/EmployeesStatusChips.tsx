"use client";

import Link from "next/link";
import { LayoutGroup, motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { parseEmployeeListStatus } from "@/lib/admin-employee-list";
import type {
  EmployeeListStatusFilter,
  EmployeesStatusChipsProps,
} from "@/types/admin";

const CHIPS: {
  status: EmployeeListStatusFilter;
  label: string;
  countKey: keyof EmployeesStatusChipsProps["counts"];
}[] = [
  { status: "all", label: "All", countKey: "all" },
  { status: "active", label: "Active", countKey: "active" },
  { status: "on_hold", label: "On hold", countKey: "onHold" },
  { status: "inactive", label: "Inactive", countKey: "inactive" },
];

export function EmployeesStatusChips({ counts }: EmployeesStatusChipsProps) {
  const sp = useSearchParams();
  const current = parseEmployeeListStatus(sp.get("status") ?? undefined);

  function hrefFor(status: EmployeeListStatusFilter) {
    const params = new URLSearchParams(sp.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    const query = params.toString();
    return query ? `/admin/employees?${query}` : "/admin/employees";
  }

  return (
    <LayoutGroup id="employee-status-chips">
      <div
        className="inline-flex rounded-full bg-[var(--color-cream-tint)] p-1"
        role="group"
        aria-label="Filter by status"
      >
        {CHIPS.map((chip) => {
          const selected = current === chip.status;
          const count = counts[chip.countKey];

          return (
            <Link
              key={chip.status}
              href={hrefFor(chip.status)}
              aria-label={`Show ${chip.label.toLowerCase()} people, ${count}`}
              aria-current={selected ? "true" : undefined}
              className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                selected
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {selected ? (
                <motion.span
                  layoutId="employee-status-chip"
                  className="absolute inset-0 rounded-full bg-[var(--color-surface)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{chip.label}</span>
              <span className="relative z-10 tabular-nums">{count}</span>
            </Link>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
