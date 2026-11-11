import Link from "next/link";
import { CountryFlag } from "@/lib/country-icons";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { formatCairoDateTime } from "@/lib/cairo-date";
import { adminEmployeeHref } from "@/lib/admin-view";
import { regionDisplayLabel } from "@/lib/project-labels";
import { normalizeProjectRegion } from "@/lib/admin-view";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type { AdminWeeklyChecksTableProps } from "@/types/weekly-checks";

const EMPTY: Record<AdminWeeklyChecksTableProps["filter"], string> = {
  unchecked: "Every account has been checked this week.",
  issue: "No problems reported this week.",
  changed: "No accounts were added or edited this week.",
  ok: "No accounts checked OK yet this week.",
  all: "No accounts found.",
};

export function WeeklyChecksTable({
  rows,
  matching,
  filter,
}: AdminWeeklyChecksTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[14px] text-[var(--color-muted)]">
        {EMPTY[filter]}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {matching > rows.length ? (
        <p className="text-[13px] tabular-nums text-[var(--color-muted)]">
          {rows.length} / {matching}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[1100px] text-left text-[13px]">
          <thead className="border-b border-[var(--color-hairline)] bg-[var(--color-cream-tint)] text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">
            <tr>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Holder</th>
              <th className="px-4 py-3">Country Manager</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">This week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = row.username || row.accountName || "Account";
              const project = normalizeProjectRegion(row.region);
              return (
                <tr
                  key={row.accountId}
                  className="border-b border-[var(--color-hairline)] last:border-b-0 align-top"
                >
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-ink)]">
                      {row.country ? (
                        <CountryFlag
                          country={row.country}
                          className="h-4 w-6"
                        />
                      ) : null}
                      {row.country ?? "—"}
                    </span>
                    {project ? (
                      <span className="block text-[11px] text-[var(--color-muted)]">
                        {regionDisplayLabel(project)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={adminEmployeeHref(row.holderId)}
                      className="font-semibold text-[var(--color-ink)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                    >
                      {row.holderName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink)]">
                    {row.managerName ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink)]">
                    {PLATFORM_LABELS[row.platform] ?? row.platform}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="block font-medium text-[var(--color-ink)]">
                      {name}
                    </span>
                    {row.accountUrl ? (
                      <AccountUrlCell url={row.accountUrl} label={name} />
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <AccountStatusBadge
                      status={row.status as "active" | "archived" | "suspended"}
                    />
                    {row.changedThisWeek ? (
                      <span className="mt-1 block text-[11px] font-semibold text-[var(--color-amber)]">
                        Changed this week
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    {row.check ? (
                      <>
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-[12px] font-bold ${
                            row.check.result === "ok"
                              ? "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
                              : "bg-[var(--color-coral-tint)] text-[var(--color-coral)]"
                          }`}
                        >
                          {row.check.result === "ok" ? "Checked OK" : "Problem"}
                        </span>
                        {row.check.note ? (
                          <span className="mt-1 block max-w-[240px] text-[12px] text-[var(--color-coral)]">
                            {row.check.note}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-[11px] text-[var(--color-muted)]">
                          {row.check.checkedByName ?? "—"} ·{" "}
                          {formatCairoDateTime(row.check.checkedAt)}
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex rounded-md bg-[var(--color-amber)]/15 px-2 py-1 text-[12px] font-bold text-[var(--color-amber)]">
                        Not checked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
