"use client";

import { EmployeesStatusChips } from "@/app/(app)/admin/employees/components/EmployeesStatusChips";
import { EmployeesToolbarFilters } from "@/app/(app)/admin/employees/components/EmployeesToolbarFilters";
import { EmployeesToolbarSearch } from "@/app/(app)/admin/employees/components/EmployeesToolbarSearch";
import type { EmployeesTableToolbarProps } from "@/types/admin";

export function EmployeesTableToolbar({
  initialQ,
  counts,
}: EmployeesTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-hairline)] px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
      <EmployeesToolbarSearch initialQ={initialQ} />
      <EmployeesStatusChips counts={counts} />
      <div className="lg:ml-auto">
        <EmployeesToolbarFilters />
      </div>
    </div>
  );
}
