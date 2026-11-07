"use client";

import { useEffect, useRef, useState } from "react";
import type { EmployeesTableProps } from "@/types/admin";
import { EmployeeTableRow } from "@/components/admin/EmployeeTableRow";

const PAGE_SIZE = 50;

export function EmployeesTable({
  rows,
  holders,
  toolbar,
  canManagePermissions = false,
}: EmployeesTableProps) {
  // Draw 50 rows first, then 50 more each time the bottom comes into view.
  // The page keys this table by its filters, so new filters start from the top.
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visible < rows.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((count) => count + PAGE_SIZE);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  return (
    <div className="rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      {toolbar}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
            <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Project
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
              rows.slice(0, visible).map((row) => (
                <EmployeeTableRow
                  key={`${row.source}-${row.id}`}
                  row={row}
                  holders={holders}
                  canManagePermissions={canManagePermissions}
                />
              ))
            )}
          </tbody>
        </table>
        {hasMore ? (
          <div
            ref={sentinelRef}
            className="px-4 py-4 text-center text-[13px] text-[var(--color-muted)]"
            aria-live="polite"
          >
            Showing {visible} of {rows.length}…
          </div>
        ) : null}
      </div>
    </div>
  );
}
