import type { AdminEmployeePanel, AdminView } from "@/types/admin";

export function normalizeAdminEmployeePanel(
  raw: string | undefined
): AdminEmployeePanel {
  if (raw === "targets" || raw === "wallet" || raw === "activity") {
    return raw;
  }
  return "profile";
}

/** Prefer `panel`; accept legacy `tab` as an alias. */
export function resolveAdminEmployeePanel(params: {
  panel?: string;
  tab?: string;
}): AdminEmployeePanel {
  return normalizeAdminEmployeePanel(params.panel ?? params.tab);
}

export function adminRoleBadge(role: string) {
  if (role === "admin") return "Admin";
  if (role === "team_lead") return "Team lead";
  if (role === "manager") return "Manager";
  return "Employee";
}

export function adminViewOverview(): AdminView {
  return { kind: "overview", title: "Admin overview" };
}

export function adminViewEmployees(): AdminView {
  return { kind: "employees", title: "Employees" };
}

export function adminViewEmployeeNew(): AdminView {
  return { kind: "employee_new", title: "New employee" };
}

export function adminViewEmployee(input: {
  employeeId: number;
  employeeName: string;
  role: string;
  panel: AdminEmployeePanel;
}): AdminView {
  return {
    kind: "employee",
    title: input.employeeName,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    roleBadge: adminRoleBadge(input.role),
    panel: input.panel,
  };
}

export function adminViewPayouts(): AdminView {
  return { kind: "payouts", title: "Payouts" };
}

export function adminWorkspaceBackHref(view: AdminView): string | null {
  switch (view.kind) {
    case "overview":
      return null;
    case "employees":
    case "payouts":
      return "/admin";
    case "employee_new":
    case "employee":
      return "/admin/employees";
  }
}

export const ADMIN_EMPLOYEE_PANELS: {
  id: AdminEmployeePanel;
  label: string;
}[] = [
  { id: "profile", label: "Profile" },
  { id: "targets", label: "Targets" },
  { id: "wallet", label: "Wallet" },
  { id: "activity", label: "Activity" },
];
