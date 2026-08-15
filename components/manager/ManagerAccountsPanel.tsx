"use client";

import { ManagerAccountsTable } from "@/components/manager/ManagerAccountsTable";
import type { ManagerAccountsPanelProps } from "@/types/manager";

export function ManagerAccountsPanel({
  fullName,
  accounts,
  assignedCount,
}: ManagerAccountsPanelProps) {
  const total = accounts.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-[var(--color-muted)]">
        {assignedCount > 0
          ? `${total} of ${assignedCount} assigned accounts`
          : `${total} ${total === 1 ? "account" : "accounts"}`}
      </p>
      {accounts.length === 0 ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-6 text-center text-[14px] text-[var(--color-muted)]">
          No social accounts have been added for {fullName} yet.
        </p>
      ) : (
        <ManagerAccountsTable accounts={accounts} />
      )}
    </div>
  );
}
