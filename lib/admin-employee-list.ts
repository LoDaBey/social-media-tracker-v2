import type {
  AdminEmployeeListRow,
  EmployeeListStatusCounts,
  EmployeeListStatusFilter,
} from "@/types/admin";

export function employeeListStatus(
  row: AdminEmployeeListRow
): Exclude<EmployeeListStatusFilter, "all"> {
  if (row.employment_status === "on_hold") return "on_hold";
  if (!row.is_active || row.employment_status === "deactivated") {
    return "inactive";
  }
  return "active";
}

export function employeeListStatusCounts(
  rows: AdminEmployeeListRow[]
): EmployeeListStatusCounts {
  const counts: EmployeeListStatusCounts = {
    all: rows.length,
    active: 0,
    onHold: 0,
    inactive: 0,
  };

  for (const row of rows) {
    const status = employeeListStatus(row);
    if (status === "active") counts.active += 1;
    else if (status === "on_hold") counts.onHold += 1;
    else counts.inactive += 1;
  }

  return counts;
}

export function filterEmployeesByListStatus(
  rows: AdminEmployeeListRow[],
  status: EmployeeListStatusFilter
) {
  if (status === "all") return rows;
  return rows.filter((row) => employeeListStatus(row) === status);
}

export function parseEmployeeListStatus(
  value: string | undefined
): EmployeeListStatusFilter {
  if (value === "active" || value === "inactive" || value === "on_hold") {
    return value;
  }
  return "all";
}
