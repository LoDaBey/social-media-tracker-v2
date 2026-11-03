import { StrategyPlatformIcon } from "@/app/(app)/admin/strategy/components/StrategyPlatformIcon";
import type { AdminCoveragePlatformHeadCellProps } from "@/types/admin";

export function AdminCoveragePlatformHeadCell({
  platform,
  label,
  caption,
  className = "min-w-[5.75rem] px-4 py-3 align-bottom",
}: AdminCoveragePlatformHeadCellProps) {
  return (
    <th scope="col" className={className} title={label}>
      <span className="inline-flex flex-col items-start gap-1">
        <StrategyPlatformIcon platform={platform} className="h-6 w-6" />
        <span className="sr-only">{label}</span>
        {caption ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {caption}
          </span>
        ) : null}
      </span>
    </th>
  );
}
