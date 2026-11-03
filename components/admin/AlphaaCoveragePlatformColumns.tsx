import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { AdminCoveragePlatformHeadCell } from "@/components/admin/AdminCoveragePlatformHeadCell";
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
    <AdminCoveragePlatformHeadCell
      key={platform}
      platform={platform}
      label={ALPHAA_EXTRA_PLATFORM_LABELS[platform]}
      className="min-w-[6.5rem] px-4 py-3 align-bottom"
    />
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
    <td key={platform} className="min-w-[6.5rem] whitespace-nowrap px-4 py-3">
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
    <td key={platform} className="min-w-[6.5rem] whitespace-nowrap px-4 py-3">
      <AdminCoverageCountCell
        count={totals?.[platform] ?? zeroCount()}
        label={`Total ${ALPHAA_EXTRA_PLATFORM_LABELS[platform]} accounts`}
      />
    </td>
  ));
}
