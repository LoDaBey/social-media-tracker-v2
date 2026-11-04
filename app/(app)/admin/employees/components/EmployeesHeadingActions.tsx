import { AdminNewEmployeeButton } from "@/app/(app)/admin/components/AdminNewEmployeeButton";
import type { EmployeesHeadingActionsProps } from "@/types/admin";

export function EmployeesHeadingActions({
  canCreateEmployees = true,
}: EmployeesHeadingActionsProps) {
  if (!canCreateEmployees) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <AdminNewEmployeeButton />
    </div>
  );
}
