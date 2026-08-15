"use client";

import { AccountRow } from "@/components/admin/AccountRow";
import type { EmployeeAccountsTableProps } from "@/types/admin";

export function EmployeeAccountsTable({
  userId,
  fullName,
  accounts,
  onChanged,
}: EmployeeAccountsTableProps) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-2">
              Platform
            </th>
            <th scope="col" className="px-4 py-2">
              Username
            </th>
            <th scope="col" className="px-4 py-2">
              URL
            </th>
            <th scope="col" className="px-4 py-2">
              Category
            </th>
            <th scope="col" className="px-4 py-2">
              Status
            </th>
            <th scope="col" className="px-4 py-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <AccountRow
              key={account.id}
              holderId={userId}
              holderName={fullName}
              account={account}
              onChanged={onChanged}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
