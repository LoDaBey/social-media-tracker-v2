"use client";

import { SyncSheetsButton } from "@/components/admin/SyncSheetsButton";

export function ManagerSyncSheetsButton() {
  return (
    <SyncSheetsButton
      variant="button"
      ariaLabel="Sync accounts with Google Sheet"
      title="Sync accounts with Google Sheet"
      label="Sync accounts with Google Sheet"
    />
  );
}
