import { AdminOverviewUpdatedAt } from "@/app/(app)/admin/components/AdminOverviewUpdatedAt";
import type { AdminOverviewSubtitleProps } from "@/types/admin";

export function AdminOverviewSubtitle({
  countryCount,
  generatedAt,
}: AdminOverviewSubtitleProps) {
  const countryLabel =
    countryCount === 1 ? "1 country" : `${countryCount} countries`;

  return (
    <p className="text-[14px] text-[var(--color-muted)]">
      Current against plan, across {countryLabel}.{" "}
      <AdminOverviewUpdatedAt generatedAt={generatedAt} />
    </p>
  );
}
