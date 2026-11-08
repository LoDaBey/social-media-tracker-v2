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
import {
  mainScopeColumns,
  mainScopeSubColumnCount,
} from "@/lib/main-scope-coverage";
import {
  MainScopeBodyCells,
  MainScopeColGroup,
  MainScopeGroupHeadCells,
  MainScopeSubHeadCells,
} from "@/components/admin/MainScopeCoverageCells";
import type {
  AdminCountryCoverageTableProps,
  MainScopeColumn,
} from "@/types/admin";

/**
 * Main tab: one column per platform, split underneath into personal / umbrella
 * (or a single native cell), so each scope shows its own actual / target.
 */
function MainScopeCoverageTable({
  rows,
  totals,
  columns,
}: AdminCountryCoverageTableProps & { columns: MainScopeColumn[] }) {
  const subColumns = mainScopeSubColumnCount(columns);
  const minWidth = 220 + 104 + 92 * 2 + 84 * subColumns;
  const fixed = `${COVERAGE_HEAD_CELL} align-bottom`;

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full table-fixed border-collapse text-left" style={{ minWidth }}>
        <colgroup>
          <col className={COVERAGE_COL.country} />
          <col className={COVERAGE_COL.language} />
          <col className={COVERAGE_COL.metric} />
          <MainScopeColGroup columns={columns} />
          <col className={COVERAGE_COL.metric} />
        </colgroup>
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th
              scope="col"
              rowSpan={2}
              className={`sticky left-0 z-[1] bg-[var(--color-surface)] align-bottom ${COVERAGE_COUNTRY_CELL}`}
            >
              Country
            </th>
            <th scope="col" rowSpan={2} className={`align-bottom ${COVERAGE_LANGUAGE_CELL}`}>
              Language
            </th>
            <th scope="col" rowSpan={2} className={fixed}>
              Resources
            </th>
            <MainScopeGroupHeadCells columns={columns} />
            <th scope="col" rowSpan={2} className={`${fixed} border-l border-[var(--color-hairline)]`}>
              Total
            </th>
          </tr>
          <tr>
            <MainScopeSubHeadCells columns={columns} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <AdminCountryCoverageRow
              key={row.country}
              row={row}
              showAlphaaPlatforms
              scopeColumns={columns}
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
            <MainScopeBodyCells columns={columns} scopes={totals.scopes} labelPrefix="Total" />
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell count={totals.totalAccounts} label="Grand total accounts" />
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function AdminCountryCoverageTable({
  rows,
  totals,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageTableProps) {
  if (showAlphaaPlatforms && totals.scopes) {
    const columns = mainScopeColumns([
      totals.scopes,
      ...rows.map((row) => row.scopes),
      ...rows.flatMap((row) => row.holders.map((holder) => holder.scopes)),
    ]);
    return <MainScopeCoverageTable rows={rows} totals={totals} columns={columns} />;
  }

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
