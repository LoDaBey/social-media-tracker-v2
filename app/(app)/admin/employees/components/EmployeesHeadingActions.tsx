import { AdminNewEmployeeButton } from "@/app/(app)/admin/components/AdminNewEmployeeButton";
import { EmployeesBulkImportButton } from "@/components/admin/EmployeesBulkImportButton";
import { SyncSheetsButton } from "@/components/admin/SyncSheetsButton";
import type { EmployeesHeadingActionsProps } from "@/types/admin";

export function EmployeesHeadingActions({
  holders,
}: EmployeesHeadingActionsProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <EmployeesBulkImportButton holders={holders} variant="button" />
      <SyncSheetsButton variant="button" label="Sync sheets" />
      <AdminNewEmployeeButton />
    </div>
  );
}
