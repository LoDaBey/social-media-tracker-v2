"use client";

import { ManagerTeamHeader } from "@/components/manager/ManagerTeamHeader";
import { ManagerTeamRow } from "@/components/manager/ManagerTeamRow";
import type { ManagerHomeTableProps } from "@/types/manager";

export function ManagerHomeTable({ groups }: ManagerHomeTableProps) {
  const rows = groups.flatMap((group) => group.holders);
  const pending = rows.filter((h) => !h.setupComplete).length;
  const overall = rows.reduce(
    (sum, holder) => ({
      added: sum.added + holder.accountTotal,
      assigned: sum.assigned + holder.targetAccountsSum,
    }),
    { added: 0, assigned: 0 }
  );
  const holderOptions = rows.map((holder) => ({
    id: holder.id,
    full_name: holder.full_name,
    country: holder.country,
  }));
  const countries = groups.map((group) => ({
    country: group.country,
    added: group.holders.reduce((sum, holder) => sum + holder.accountTotal, 0),
    assigned: group.holders.reduce(
      (sum, holder) => sum + holder.targetAccountsSum,
      0
    ),
  }));

  return (
    <div className="w-full">
      <ManagerTeamHeader
        holderCount={rows.length}
        pendingCount={pending}
        overall={overall}
        countries={countries}
      />

      <div className="mt-8 overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[1320px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
            <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-4 py-3">
                Country
              </th>
              <th scope="col" className="px-4 py-3">
                Account holder
              </th>
              <th scope="col" className="px-4 py-3">
                Employee code
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                Email
              </th>
              <th scope="col" className="px-4 py-3">
                Assigned accounts
              </th>
              <th scope="col" className="px-4 py-3">
                Account total
              </th>
              <th scope="col" className="px-4 py-3">
                Setup
              </th>
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-[14px] text-[var(--color-muted)]"
                >
                  No account holders in your countries yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <ManagerTeamRow
                  key={row.id}
                  row={row}
                  holderOptions={holderOptions}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
