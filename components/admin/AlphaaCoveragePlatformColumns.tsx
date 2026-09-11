import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
  ALPHAA_EXTRA_PLATFORM_LABELS,
} from "@/lib/alphaa-coverage-platforms";
import type {
  AlphaaCoveragePlatformColumnsProps,
  AlphaaExtraPlatformCoverage,
} from "@/types/admin";

function zeroCount() {
  return { actual: 0, target: 0 };
}

export function AlphaaCoveragePlatformHeaderCells() {
  return ALPHAA_EXTRA_PLATFORM_KEYS.map((platform) => (
    <th key={platform} scope="col" className="px-3 py-2.5">
      {ALPHAA_EXTRA_PLATFORM_LABELS[platform]}
    </th>
  ));
}

export function AlphaaCoveragePlatformBodyCells({
  platforms,
  labelPrefix,
}: {
  platforms?: AlphaaExtraPlatformCoverage;
  labelPrefix: string;
}) {
  return ALPHAA_EXTRA_PLATFORM_KEYS.map((platform) => (
    <td key={platform} className="px-3 py-2.5">
      <AdminCoverageCountCell
        count={platforms?.[platform] ?? zeroCount()}
        label={`${labelPrefix} ${ALPHAA_EXTRA_PLATFORM_LABELS[platform]} accounts`}
      />
    </td>
  ));
}

export function AlphaaCoveragePlatformFooterCells({
  totals,
}: Pick<AlphaaCoveragePlatformColumnsProps, "totals">) {
  return ALPHAA_EXTRA_PLATFORM_KEYS.map((platform) => (
    <td key={platform} className="px-3 py-2.5">
      <AdminCoverageCountCell
        count={totals?.[platform] ?? zeroCount()}
        label={`Total ${ALPHAA_EXTRA_PLATFORM_LABELS[platform]} accounts`}
      />
    </td>
  ));
}
