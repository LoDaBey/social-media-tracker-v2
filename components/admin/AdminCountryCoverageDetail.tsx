import { CountryFlag } from "@/lib/country-icons";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { AdminCountryHolderGapRow } from "@/components/admin/AdminCountryHolderGapRow";
import { AdminCoveragePlatformHeadCell } from "@/components/admin/AdminCoveragePlatformHeadCell";
import { AlphaaCoveragePlatformBodyCells } from "@/components/admin/AlphaaCoveragePlatformColumns";
import { AlphaaCoveragePlatformHeaderCells } from "@/components/admin/AlphaaCoveragePlatformColumns";
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
import type { AdminCountryCoverageDetailProps } from "@/types/admin";

export function AdminCountryCoverageDetail({
  row,
  showAlphaaPlatforms = false,
}: AdminCountryCoverageDetailProps) {
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
              Account holder
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
          <tr className="border-t border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/60">
            <th
              scope="row"
              className={`sticky left-0 z-[1] bg-[var(--color-cream-tint)] ${COVERAGE_COUNTRY_CELL}`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <CountryFlag
                  country={row.country}
                  title={row.country}
                  className="h-4 w-6 shrink-0"
                />
                <span className="min-w-0 truncate text-[13px] font-extrabold text-[var(--color-ink)]">
                  {row.country}
                </span>
              </div>
            </th>
            <td className={`text-[13px] text-[var(--color-muted)] ${COVERAGE_LANGUAGE_CELL}`}>
              {row.language}
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.resources}
                label={`${row.country} employees`}
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.x}
                label={`${row.country} X accounts`}
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.facebookPersonal}
                label={`${row.country} Facebook personal accounts`}
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.facebookUmbrella}
                label={`${row.country} Facebook umbrella accounts`}
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.instagram}
                label={`${row.country} Instagram accounts`}
              />
            </td>
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.tiktok}
                label={`${row.country} TikTok accounts`}
              />
            </td>
            {showAlphaaPlatforms ? (
              <AlphaaCoveragePlatformBodyCells
                platforms={row.extraPlatforms}
                labelPrefix={row.country}
              />
            ) : null}
            <td className={COVERAGE_BODY_CELL}>
              <AdminCoverageCountCell
                count={row.totalAccounts}
                label={`${row.country} total accounts`}
              />
            </td>
          </tr>
          {row.holders.length > 0 ? (
            row.holders.map((holder, index) => (
              <AdminCountryHolderGapRow
                key={holder.id ?? `vacant-${row.country}-${index}`}
                holder={holder}
                country={row.country}
                language={row.language}
                showAlphaaPlatforms={showAlphaaPlatforms}
              />
            ))
          ) : (
            <tr className="border-t border-[var(--color-hairline)]">
              <td
                colSpan={coverageColumnCount(showAlphaaPlatforms)}
                className="px-4 py-6 text-center text-[13px] text-[var(--color-muted)]"
              >
                No account holders in {row.country} yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
