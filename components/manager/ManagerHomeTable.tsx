"use client";

import { ManagerTeamRow } from "@/components/manager/ManagerTeamRow";
import type { ManagerHomeTableProps } from "@/types/manager";

export function ManagerHomeTable({ groups }: ManagerHomeTableProps) {
  const rows = groups.flatMap((group) => group.holders);
  const pending = rows.filter((h) => !h.setupComplete).length;

  return (
    <div className="w-full">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-tight text-[var(--color-ink)]">
            Your team
          </h1>
          <p className="mt-2 text-[15px] text-[var(--color-muted)]">
            Account holders in your countries. Click anyone to complete their SMD
            setup.
          </p>
        </div>
        <p className="text-[13px] font-semibold text-[var(--color-muted)]">
          {rows.length} holders · {pending} setup pending
        </p>
      </header>

      <div className="mt-8 overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
            <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-4 py-3">
                Country
              </th>
              <th scope="col" className="px-4 py-3">
                Account holder
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                Email
              </th>
              <th scope="col" className="px-4 py-3">
                Assigned accounts
              </th>
              <th scope="col" className="px-4 py-3">
                Setup
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
                  colSpan={6}
                  className="px-4 py-12 text-center text-[14px] text-[var(--color-muted)]"
                >
                  No account holders in your countries yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => <ManagerTeamRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
