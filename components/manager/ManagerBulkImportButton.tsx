"use client";

import { EmployeesBulkImportButton } from "@/components/admin/EmployeesBulkImportButton";
import type { ManagerBulkImportButtonProps } from "@/types/manager";

export function ManagerBulkImportButton({
  holders,
  allowedCountries,
  initialHolderId,
  variant = "button",
}: ManagerBulkImportButtonProps) {
  return (
    <EmployeesBulkImportButton
      holders={holders}
      allowedCountries={allowedCountries}
      initialHolderId={initialHolderId}
      initialHolderSource="temp"
      variant={variant}
    />
  );
}
