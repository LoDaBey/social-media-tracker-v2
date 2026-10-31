import { AdminNewEmployeeButton } from "@/app/(app)/admin/components/AdminNewEmployeeButton";
import { BalanceCoverageButton } from "@/app/(app)/admin/components/BalanceCoverageButton";
import type { AdminOverviewHeadingActionsProps } from "@/types/admin";

export function AdminOverviewHeadingActions({
  region,
}: AdminOverviewHeadingActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <BalanceCoverageButton region={region} />
      <AdminNewEmployeeButton />
    </div>
  );
}
