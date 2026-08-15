import Link from "next/link";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { holderGapSummary, holderHasCoverageGap } from "@/lib/admin-coverage-gaps";
import type { AdminCountryHolderGapRowProps } from "@/types/admin";

export function AdminCountryHolderGapRow({
  holder,
  country,
}: AdminCountryHolderGapRowProps) {
  const hasGap = holderHasCoverageGap(holder);
  const summary = holderGapSummary(holder);

  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <th
        scope="row"
        className="px-3 py-2 text-[13px] font-semibold text-[var(--color-ink)]"
      >
        {holder.vacant ? (
          <span className="text-[#E08A2C]">{holder.fullName}</span>
        ) : holder.id ? (
          <Link
            href={`/admin/employees/${holder.id}`}
            aria-label={`Open ${holder.fullName} in ${country}`}
            className="rounded-lg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            {holder.fullName}
          </Link>
        ) : (
          holder.fullName
        )}
        {holder.email ? (
          <p className="mt-0.5 text-[12px] font-medium text-[var(--color-muted)]">
            {holder.email}
          </p>
        ) : null}
        <p
          className={`mt-1 text-[12px] font-medium ${
            hasGap ? "text-[var(--color-coral)]" : "text-[var(--color-emerald)]"
          }`}
        >
          {summary}
        </p>
      </th>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.x}
          label={`${holder.fullName} X accounts`}
        />
      </td>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.facebookPersonal}
          label={`${holder.fullName} Facebook personal accounts`}
        />
      </td>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.facebookUmbrella}
          label={`${holder.fullName} Facebook umbrella accounts`}
        />
      </td>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.instagram}
          label={`${holder.fullName} Instagram accounts`}
        />
      </td>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.tiktok}
          label={`${holder.fullName} TikTok accounts`}
        />
      </td>
      <td className="px-3 py-2">
        <AdminCoverageCountCell
          count={holder.totalAccounts}
          label={`${holder.fullName} total accounts`}
        />
      </td>
    </tr>
  );
}
