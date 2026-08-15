import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import type { AdminCountryCoverageRowProps } from "@/types/admin";

export function AdminCountryCoverageRow({ row }: AdminCountryCoverageRowProps) {
  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <th
        scope="row"
        className="px-3 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]"
      >
        {row.country}
        {row.onPlan ? null : (
          <span className="ml-2 text-[11px] font-medium text-[#E08A2C]">
            Off plan
          </span>
        )}
      </th>
      <td className="px-3 py-2.5 text-[13px] text-[var(--color-muted)]">
        {row.language}
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell count={row.resources} label={`${row.country} employees`} />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell count={row.x} label={`${row.country} X accounts`} />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell
          count={row.facebookPersonal}
          label={`${row.country} Facebook personal accounts`}
        />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell
          count={row.facebookUmbrella}
          label={`${row.country} Facebook umbrella accounts`}
        />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell
          count={row.instagram}
          label={`${row.country} Instagram accounts`}
        />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell
          count={row.tiktok}
          label={`${row.country} TikTok accounts`}
        />
      </td>
      <td className="px-3 py-2.5">
        <AdminCoverageCountCell
          count={row.totalAccounts}
          label={`${row.country} total accounts`}
        />
      </td>
    </tr>
  );
}
