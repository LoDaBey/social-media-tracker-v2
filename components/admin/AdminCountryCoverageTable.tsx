import { AdminCountryCoverageRow } from "@/components/admin/AdminCountryCoverageRow";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { AdminCoveragePlatformHeadCell } from "@/components/admin/AdminCoveragePlatformHeadCell";
import {
  AlphaaCoveragePlatformFooterCells,
  AlphaaCoveragePlatformHeaderCells,
} from "@/components/admin/AlphaaCoveragePlatformColumns";
import {
  COVERAGE_BODY_CELL,
  COVERAGE_COL,
  COVERAGE_COUNTRY_CELL,
  COVERAGE_HEAD_CELL,
  COVERAGE_LANGUAGE_CELL,
  coverageColumnCount,
  coverageTableMinWidth,
} from "@/lib/admin-coverage-table-layout";
import { ALPHAA_EXTRA_PLATFORM_KEYS } from "@/lib/alphaa-coverage-platforms";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import type { AdminCountryCoverageTableProps } from "@/types/admin";

export function AdminCountryCoverageTable({
  rows,
  totals,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageTableProps) {
  const colSpan = coverageColumnCount(showAlphaaPlatforms);
  const minWidth = coverageTableMinWidth(showAlphaaPlatforms);

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table
        className="w-full table-fixed border-collapse text-left"
        style={{ minWidth }}
      >
        <colgroup>
          <col className={COVERAGE_COL.country} />
          <col className={COVERAGE_COL.language} />
          <col className={COVERAGE_COL.metric} />
          <col className={COVERAGE_COL.metric} />
          <col className={COVERAGE_COL.metric} />
          <col className={COVERAGE_COL.metric} />
          <col className={COVERAGE_COL.metric} />
          <col className={COVERAGE_COL.metric} />
          {showAlphaaPlatforms
            ? ALPHAA_EXTRA_PLATFORM_KEYS.map((platform) => (
                <col key={platform} className={COVERAGE_COL.metric} />
              ))
            : null}
          <col className={COVERAGE_COL.metric} />
        </colgroup>
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th
              scope="col"
              className={`sticky left-0 z-[1] bg-[var(--color-surface)] ${COVERAGE_COUNTRY_CELL}`}
            >
              Country
            </th>
            <th scope="col" className={COVERAGE_LANGUAGE_CELL}>
              Language
            </th>
            <th scope="col" className={COVERAGE_HEAD_CELL}>
              Resources
            </th>
            <AdminCoveragePlatformHeadCell
              platform="twitter"
              label="X"
              className={COVERAGE_HEAD_CELL}
            />
            <AdminCoveragePlatformHeadCell
              platform="facebook"
              label="Facebook personal"
              scopeIcon="personal"
              className={COVERAGE_HEAD_CELL}
            />
            <AdminCoveragePlatformHeadCell
              platform="facebook"
              label="Facebook umbrella"
              scopeIcon="umbrella"
              className={COVERAGE_HEAD_CELL}
            />
            <AdminCoveragePlatformHeadCell
              platform="instagram"
              label="Instagram"
              className={COVERAGE_HEAD_CELL}
            />
            <AdminCoveragePlatformHeadCell
              platform="tiktok"
              label="TikTok"
              className={COVERAGE_HEAD_CELL}
            />
            {showAlphaaPlatforms ? <AlphaaCoveragePlatformHeaderCells /> : null}
            <th scope="col" className={COVERAGE_HEAD_CELL}>
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
              className={`sticky left-0 z-[1] bg-[var(--color-cream-tint)] text-[13px] font-extrabold text-[var(--color-ink)] ${COVERAGE_COUNTRY_CELL}`}
            >
              Total
            </th>
            <td className={`text-[13px] text-[var(--color-muted)] ${COVERAGE_LANGUAGE_CELL}`}>
              —
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell count={totals.resources} label="Total employees" />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell count={totals.x} label="Total X accounts" />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={totals.facebookPersonal}
                label="Total Facebook personal accounts"
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={totals.facebookUmbrella}
                label="Total Facebook umbrella accounts"
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={totals.instagram}
                label="Total Instagram accounts"
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={totals.tiktok}
                label="Total TikTok accounts"
              />
            </td>
            {showAlphaaPlatforms ? (
              <AlphaaCoveragePlatformFooterCells totals={totals.extraPlatforms} />
            ) : null}
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={totals.totalAccounts}
                label="Grand total accounts"
              />
            </td>
          </tr>
        </tfoot>
      </table>
      {showAlphaaPlatforms ? (
        <p className="sr-only">
          Table has {colSpan} columns including {MAIN_PROJECT_LABEL} platforms.
        </p>
      ) : null}
    </div>
  );
}
