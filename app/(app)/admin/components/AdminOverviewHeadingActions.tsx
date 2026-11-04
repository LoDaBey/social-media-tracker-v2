import { AdminNewEmployeeButton } from "@/app/(app)/admin/components/AdminNewEmployeeButton";
import { BalanceCoverageButton } from "@/app/(app)/admin/components/BalanceCoverageButton";
import type { AdminOverviewHeadingActionsProps } from "@/types/admin";

export function AdminOverviewHeadingActions({
  region,
  canCreateEmployees = true,
}: AdminOverviewHeadingActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {canCreateEmployees ? <BalanceCoverageButton region={region} /> : null}
      {canCreateEmployees ? <AdminNewEmployeeButton /> : null}
    </div>
  );
}
