import type { EmployeesTableProps } from "@/types/admin";
import { EmployeeTableRow } from "@/components/admin/EmployeeTableRow";

export function EmployeesTable({ rows, holders, toolbar }: EmployeesTableProps) {
  return (
    <div className="rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      {toolbar}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
            <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Employee code
              </th>
              <th scope="col" className="px-4 py-3">
                Country
              </th>
              <th scope="col" className="px-4 py-3">
                Role
              </th>
              <th scope="col" className="px-4 py-3">
                Team lead
              </th>
              <th scope="col" className="px-4 py-3">
                Assigned accounts
              </th>
              <th scope="col" className="px-4 py-3">
                Account total
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
                  No people match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <EmployeeTableRow
                  key={`${row.source}-${row.id}`}
                  row={row}
                  holders={holders}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
