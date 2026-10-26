import { AdminCountryCoverageRow } from "@/components/admin/AdminCountryCoverageRow";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import {
  AlphaaCoveragePlatformFooterCells,
  AlphaaCoveragePlatformHeaderCells,
} from "@/components/admin/AlphaaCoveragePlatformColumns";
import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import type { AdminCountryCoverageTableProps } from "@/types/admin";

export function AdminCountryCoverageTable({
  rows,
  totals,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageTableProps) {
  const colSpan = showAlphaaPlatforms ? 9 + ALPHAA_EXTRA_PLATFORM_KEYS.length : 9;
  const headCell =
    "px-4 py-3 align-bottom leading-tight min-w-[5.75rem]";
  const wideHeadCell =
    "min-w-[8rem] px-4 py-3 align-bottom leading-tight";

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table
        className={`w-full border-collapse text-left ${
          showAlphaaPlatforms ? "min-w-[1760px]" : "min-w-[1080px]"
        }`}
      >
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th
              scope="col"
              className="sticky left-0 z-[1] min-w-[13rem] bg-[var(--color-surface)] px-4 py-3"
            >
              Country
            </th>
            <th scope="col" className={headCell}>
              Language
            </th>
            <th scope="col" className={headCell}>
              Resources
            </th>
            <th scope="col" className={headCell}>
              X
            </th>
            <th scope="col" className={wideHeadCell}>
              Facebook personal
            </th>
            <th scope="col" className={wideHeadCell}>
              Facebook umbrella
            </th>
            <th scope="col" className={headCell}>
              Instagram
            </th>
            <th scope="col" className={headCell}>
              TikTok
            </th>
            {showAlphaaPlatforms ? <AlphaaCoveragePlatformHeaderCells /> : null}
            <th scope="col" className={headCell}>
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
              className="sticky left-0 z-[1] bg-[var(--color-cream-tint)] px-4 py-3 text-[13px] font-extrabold text-[var(--color-ink)]"
            >
              Total
            </th>
            <td className="whitespace-nowrap px-4 py-3 text-[13px] text-[var(--color-muted)]">
              —
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell count={totals.resources} label="Total employees" />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell count={totals.x} label="Total X accounts" />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell
                count={totals.facebookPersonal}
                label="Total Facebook personal accounts"
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell
                count={totals.facebookUmbrella}
                label="Total Facebook umbrella accounts"
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell
                count={totals.instagram}
                label="Total Instagram accounts"
              />
            </td>
            <td className="whitespace-nowrap px-4 py-3">
              <AdminCoverageCountCell
                count={totals.tiktok}
                label="Total TikTok accounts"
              />
            </td>
            {showAlphaaPlatforms ? (
              <AlphaaCoveragePlatformFooterCells totals={totals.extraPlatforms} />
            ) : null}
            <td className="whitespace-nowrap px-4 py-3">
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
