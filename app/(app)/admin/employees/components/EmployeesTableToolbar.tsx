"use client";

import { EmployeesStatusChips } from "@/app/(app)/admin/employees/components/EmployeesStatusChips";
import { EmployeesToolbarFilters } from "@/app/(app)/admin/employees/components/EmployeesToolbarFilters";
import { EmployeesToolbarSearch } from "@/app/(app)/admin/employees/components/EmployeesToolbarSearch";
import { EmployeesBulkImportButton } from "@/components/admin/EmployeesBulkImportButton";
import { SyncSheetsButton } from "@/components/admin/SyncSheetsButton";
import type { EmployeesTableToolbarProps } from "@/types/admin";

export function EmployeesTableToolbar({
  initialQ,
  counts,
  holders,
  canCreateEmployees = true,
}: EmployeesTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--color-hairline)] px-4 py-3 lg:flex-row lg:items-center lg:gap-4">
      <EmployeesToolbarSearch initialQ={initialQ} />
      <EmployeesStatusChips counts={counts} />
      <div className="flex min-w-0 flex-wrap items-center gap-2 lg:ml-auto">
        <EmployeesToolbarFilters />
        {canCreateEmployees ? (
          <>
            <EmployeesBulkImportButton holders={holders} variant="button" />
            <SyncSheetsButton variant="button" label="Sync sheets" />
          </>
        ) : null}
      </div>
    </div>
  );
}
