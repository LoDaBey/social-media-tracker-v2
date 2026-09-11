import { AdminCountryCoverageRow } from "@/components/admin/AdminCountryCoverageRow";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import {
  AlphaaCoveragePlatformFooterCells,
  AlphaaCoveragePlatformHeaderCells,
} from "@/components/admin/AlphaaCoveragePlatformColumns";
import type { AdminCountryCoverageTableProps } from "@/types/admin";

export function AdminCountryCoverageTable({
  rows,
  totals,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageTableProps) {
  const colSpan = showAlphaaPlatforms ? 18 : 9;

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[1080px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-3 py-2.5">
              Country
            </th>
            <th scope="col" className="px-3 py-2.5">
              Language
            </th>
            <th scope="col" className="px-3 py-2.5">
              Resources
            </th>
            <th scope="col" className="px-3 py-2.5">
              X
            </th>
            <th scope="col" className="px-3 py-2.5">
              Facebook personal
            </th>
            <th scope="col" className="px-3 py-2.5">
              Facebook umbrella
            </th>
            <th scope="col" className="px-3 py-2.5">
              Instagram
            </th>
            <th scope="col" className="px-3 py-2.5">
              TikTok
            </th>
            {showAlphaaPlatforms ? <AlphaaCoveragePlatformHeaderCells /> : null}
            <th scope="col" className="px-3 py-2.5">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AdminCountryCoverageRow
              key={row.country}
              row={row}
              showAlphaaPlatforms={showAlphaaPlatforms}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--color-hairline)] bg-[var(--color-cream-tint)]">
            <th
              scope="row"
              className="px-3 py-2.5 text-[13px] font-extrabold text-[var(--color-ink)]"
            >
              Total
            </th>
            <td className="px-3 py-2.5 text-[13px] text-[var(--color-muted)]">
              —
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell count={totals.resources} label="Total employees" />
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell count={totals.x} label="Total X accounts" />
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell
                count={totals.facebookPersonal}
                label="Total Facebook personal accounts"
              />
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell
                count={totals.facebookUmbrella}
                label="Total Facebook umbrella accounts"
              />
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell
                count={totals.instagram}
                label="Total Instagram accounts"
              />
            </td>
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell
                count={totals.tiktok}
                label="Total TikTok accounts"
              />
            </td>
            {showAlphaaPlatforms ? (
              <AlphaaCoveragePlatformFooterCells totals={totals.extraPlatforms} />
            ) : null}
            <td className="px-3 py-2.5">
              <AdminCoverageCountCell
                count={totals.totalAccounts}
                label="Grand total accounts"
              />
            </td>
          </tr>
        </tfoot>
      </table>
      {showAlphaaPlatforms ? (
        <p className="sr-only">Table has {colSpan} columns including ALPHAA platforms.</p>
      ) : null}
    </div>
  );
}
