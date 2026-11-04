import Link from "next/link";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { AlphaaCoveragePlatformBodyCells } from "@/components/admin/AlphaaCoveragePlatformColumns";
import {
  COVERAGE_BODY_CELL,
  COVERAGE_COUNTRY_CELL,
  COVERAGE_LANGUAGE_CELL,
} from "@/lib/admin-coverage-table-layout";
import { holderGapSummary, holderHasCoverageGap } from "@/lib/admin-coverage-gaps";
import { adminEmployeeHref } from "@/lib/admin-view";
import type { AdminCountryHolderGapRowProps } from "@/types/admin";

export function AdminCountryHolderGapRow({
  holder,
  country,
  language,
  showAlphaaPlatforms = false,
}: AdminCountryHolderGapRowProps) {
  const hasGap = holderHasCoverageGap(holder);
  const summary = hasGap ? holderGapSummary(holder) : null;
  const rowBg = hasGap
    ? "bg-[var(--color-coral)]/12"
    : "bg-[var(--color-cream-tint)]/50";
  const stickyBg = hasGap
    ? "bg-[#FDE8E6]"
    : "bg-[var(--color-cream-tint)]";

  return (
    <tr className={`border-t border-[var(--color-hairline)] ${rowBg}`}>
      <th
        scope="row"
        className={`sticky left-0 z-[1] text-[13px] font-semibold text-[var(--color-ink)] ${stickyBg} ${COVERAGE_COUNTRY_CELL}`}
      >
        <div className="min-w-0 pl-10">
          {holder.vacant ? (
            <span className="font-extrabold text-[var(--color-coral)]">
              {holder.fullName}
            </span>
          ) : holder.id ? (
            <Link
              href={adminEmployeeHref(holder.id, holder.source)}
              aria-label={`Open ${holder.fullName} in ${country}`}
              className="rounded-lg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              {holder.fullName}
            </Link>
          ) : (
            holder.fullName
          )}
          {summary ? (
            <p className="mt-1.5 inline-flex max-w-full rounded-md bg-[var(--color-coral)] px-2 py-1 text-[11px] font-extrabold leading-snug text-white shadow-[0_0_0_1px_rgba(180,40,40,.35)]">
              {summary}
            </p>
          ) : null}
        </div>
      </th>
      <td className={`text-[13px] text-[var(--color-muted)] ${COVERAGE_LANGUAGE_CELL}`}>
        {language || "—"}
      </td>
      <td className={`text-[13px] text-[var(--color-muted)] ${COVERAGE_BODY_CELL}`}>
        —
      </td>
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.x}
          label={`${holder.fullName} X accounts`}
        />
      </td>
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.facebookPersonal}
          label={`${holder.fullName} Facebook personal accounts`}
        />
      </td>
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.facebookUmbrella}
          label={`${holder.fullName} Facebook umbrella accounts`}
        />
      </td>
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.instagram}
          label={`${holder.fullName} Instagram accounts`}
        />
      </td>
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.tiktok}
          label={`${holder.fullName} TikTok accounts`}
        />
      </td>
      {showAlphaaPlatforms ? (
        <AlphaaCoveragePlatformBodyCells
          platforms={holder.extraPlatforms}
          labelPrefix={holder.fullName}
        />
      ) : null}
      <td className={COVERAGE_BODY_CELL}>
        <AdminCoverageCountCell
          count={holder.totalAccounts}
          label={`${holder.fullName} total accounts`}
        />
      </td>
    </tr>
  );
}
