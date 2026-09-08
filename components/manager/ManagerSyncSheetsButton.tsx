"use client";

import { SyncSheetsButton } from "@/components/admin/SyncSheetsButton";

export function ManagerSyncSheetsButton() {
  return (
    <SyncSheetsButton
      variant="button"
      endpoint="/api/manager/sync-sheets"
      ariaLabel="Sync team accounts with Google Sheet"
      title="Sync team accounts with Google Sheet"
      label="Sync accounts with Google Sheet"
    />
  );
}
