"use client";

import { useRouter } from "next/navigation";
import type { AdminTeamLeadRow } from "@/types/admin";

type Props = {
  rows: AdminTeamLeadRow[];
};

export function TeamLeadsTable({ rows }: Props) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
          <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-3">
              Name
            </th>
            <th scope="col" className="px-4 py-3">
              Email
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
            <th scope="col" className="px-4 py-3">
              Employees
            </th>
            <th scope="col" className="px-4 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const initial = (r.full_name.trim()[0] ?? "?").toUpperCase();
            return (
              <tr
                key={r.id}
                role="link"
                tabIndex={0}
                aria-label={`Open team lead ${r.full_name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/admin/employees/${r.id}`);
                  }
                }}
                onClick={() => router.push(`/admin/employees/${r.id}`)}
                className="cursor-pointer border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)] hover:bg-[var(--color-emerald-tint)]/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[14px] font-bold text-[var(--color-ink)]"
                      aria-hidden="true"
                    >
                      {initial}
                    </div>
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]">
                      {r.full_name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[14px] text-[var(--color-muted)]">{r.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                      r.is_active
                        ? "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
                        : "bg-[var(--color-hairline)] text-[var(--color-muted)]"
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
                  {r.employee_count}
                </td>
                <td className="px-4 py-3 text-[13px] font-semibold text-[var(--color-emerald)]">
                  View
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
