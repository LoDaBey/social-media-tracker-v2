"use client";

import { ManagerAccountsTable } from "@/components/manager/ManagerAccountsTable";
import { ManagerBulkImportButton } from "@/components/manager/ManagerBulkImportButton";
import type { ManagerAccountsPanelProps } from "@/types/manager";

export function ManagerAccountsPanel({
  holderId,
  fullName,
  country,
  language,
  accounts,
  assignedCount,
  holderOptions,
}: ManagerAccountsPanelProps) {
  const total = accounts.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[var(--color-muted)]">
          {assignedCount > 0
            ? `${total} of ${assignedCount} assigned accounts`
            : `${total} ${total === 1 ? "account" : "accounts"}`}
        </p>
        <ManagerBulkImportButton
          variant="button"
          holder={{
            id: holderId,
            full_name: fullName,
            country,
            language,
          }}
        />
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-6 text-center text-[14px] text-[var(--color-muted)]">
          No social accounts have been added for {fullName} yet.
        </p>
      ) : (
        <ManagerAccountsTable
          holderId={holderId}
          fullName={fullName}
          country={country}
          language={language}
          accounts={accounts}
          holderOptions={holderOptions}
        />
      )}
    </div>
  );
}
