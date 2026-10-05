import { PLATFORM_LABELS } from "@/lib/platform-config";
import { accountScopeLabel } from "@/lib/account-scope";
import type { ExtractPreviewTableProps } from "@/types/admin";

function displayRegion(region: string | null) {
  if (!region?.trim()) return "—";
  if (region.trim().toLowerCase() === "balkan") return "Europe";
  return region;
}

const PREVIEW_LIMIT = 100;

export function ExtractPreviewTable({ rows }: ExtractPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <section
        aria-label="Extract preview"
        className="rounded-[16px] bg-[var(--color-surface)] p-4 text-[14px] text-[var(--color-muted)] sm:p-5"
        style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      >
        No accounts match these filters yet. Adjust filters and click Show
        results.
      </section>
    );
  }

  const preview = rows.slice(0, PREVIEW_LIMIT);
  const hidden = rows.length - preview.length;

  return (
    <section
      aria-label="Extract preview"
      className="flex flex-col gap-3 rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-5"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-extrabold text-[var(--color-ink)]">
          Preview
        </h2>
        <p className="text-[12px] font-medium text-[var(--color-muted)]">
          Showing {preview.length.toLocaleString()} of{" "}
          {rows.length.toLocaleString()}
          {hidden > 0 ? ` · +${hidden.toLocaleString()} more in export` : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-hairline)]">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-[var(--color-cream-tint)] text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Handler</th>
              <th className="px-3 py-2">Platform</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((row) => (
              <tr
                key={row.id}
                className="border-t border-[var(--color-hairline)] text-[var(--color-ink)]"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {displayRegion(row.region)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.country ?? "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.handler_name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {PLATFORM_LABELS[row.platform] ?? row.platform}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {accountScopeLabel(row.account_scope)}
                </td>
                <td className="max-w-[180px] truncate px-3 py-2">
                  {row.account_name}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {row.username ?? "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap capitalize">
                  {row.status}
                  {row.is_spare ? " · spare" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
