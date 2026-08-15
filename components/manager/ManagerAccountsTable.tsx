"use client";

import { ManagerAccountRow } from "@/components/manager/ManagerAccountRow";
import type { ManagerAccountsTableProps } from "@/types/manager";

export function ManagerAccountsTable({
  holderId,
  fullName,
  country,
  language,
  accounts,
  holderOptions,
}: ManagerAccountsTableProps) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-2">
              Platform
            </th>
            <th scope="col" className="px-4 py-2">
              Username
            </th>
            <th scope="col" className="px-4 py-2">
              Email
            </th>
            <th scope="col" className="px-4 py-2">
              Password
            </th>
            <th scope="col" className="px-4 py-2">
              Language
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
            <ManagerAccountRow
              key={account.id}
              holderId={holderId}
              fullName={fullName}
              country={country}
              language={language}
              account={account}
              holderOptions={holderOptions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
