import type { AdminEmployeeListRow } from "@/types/admin";
import { EmployeeTableRow } from "@/components/admin/EmployeeTableRow";

type Props = {
  rows: AdminEmployeeListRow[];
};

export function EmployeesTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[880px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
          <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-3">
              Name
            </th>
            <th scope="col" className="px-4 py-3">
              Role
            </th>
            <th scope="col" className="px-4 py-3">
              Team lead
            </th>
            <th scope="col" className="px-4 py-3">
              Level
            </th>
            <th scope="col" className="px-4 py-3">
              Assigned accounts
            </th>
            <th scope="col" className="px-4 py-3">
              Cycle status
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
                colSpan={7}
                className="px-4 py-12 text-center text-[14px] text-[var(--color-muted)]"
              >
                No employees match these filters.
              </td>
            </tr>
          ) : (
            rows.map((row) => <EmployeeTableRow key={row.id} row={row} />)
          )}
        </tbody>
      </table>
    </div>
  );
}
