import type { EmploymentStatus } from "@/types/db";

export const EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  "active",
  "on_hold",
  "deactivated",
];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  deactivated: "Deactivate",
};

export function employmentStatusLabel(status: EmploymentStatus | string | null) {
  if (status === "active" || status === "on_hold" || status === "deactivated") {
    return EMPLOYMENT_STATUS_LABELS[status];
  }
  return "Active";
}
