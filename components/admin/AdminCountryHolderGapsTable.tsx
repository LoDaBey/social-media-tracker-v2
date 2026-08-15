import { AdminCountryHolderGapRow } from "@/components/admin/AdminCountryHolderGapRow";
import { holderHasCoverageGap } from "@/lib/admin-coverage-gaps";
import type { AdminCountryHolderGapsTableProps } from "@/types/admin";

export function AdminCountryHolderGapsTable({
  country,
  holders,
  missingEmployees,
}: AdminCountryHolderGapsTableProps) {
  const gapHolders = holders.filter(holderHasCoverageGap);
  const completeCount = holders.length - gapHolders.length;

  return (
    <div className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/80 p-3">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Account holders in {country}
      </p>
      <p className="mt-1 text-[12px] text-[var(--color-muted)]">
        {missingEmployees > 0
          ? `${missingEmployees} planned employee ${
              missingEmployees === 1 ? "seat is" : "seats are"
            } empty. `
          : null}
        {gapHolders.length
          ? `${gapHolders.length} holder${gapHolders.length === 1 ? "" : "s"} still below the country plan.`
          : completeCount
            ? "Every current holder meets their share of the country plan."
            : "No account holders in this country yet."}
      </p>

      <div className="mt-3 overflow-x-auto rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="px-3 py-2">
                Account holder
              </th>
              <th scope="col" className="px-3 py-2">
                X
              </th>
              <th scope="col" className="px-3 py-2">
                Facebook personal
              </th>
              <th scope="col" className="px-3 py-2">
                Facebook umbrella
              </th>
              <th scope="col" className="px-3 py-2">
                Instagram
              </th>
              <th scope="col" className="px-3 py-2">
                TikTok
              </th>
              <th scope="col" className="px-3 py-2">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {holders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-[13px] text-[var(--color-muted)]"
                >
                  No account holders to review.
                </td>
              </tr>
            ) : (
              holders.map((holder, index) => (
                <AdminCountryHolderGapRow
                  key={holder.id ?? `vacant-${country}-${index}`}
                  holder={holder}
                  country={country}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
