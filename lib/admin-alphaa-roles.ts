import type { Role } from "@/types/db";

export function mapAlphaaRole(role: string): Role {
  const value = role.trim().toLowerCase();
  if (value === "team leader" || value === "team_lead") return "team_lead";
  if (value === "manager") return "manager";
  if (value === "admin") return "admin";
  if (value === "op") return "op";
  if (value === "hoo" || value === "head of department") return "hoo";
  return "employee";
}

/** Map Orbit roles back to legacy Main/ALPHAA role labels. */
export function alphaaRoleLabelFromRole(role: Role): string {
  switch (role) {
    case "team_lead":
      return "Team Leader";
    case "manager":
      return "Manager";
    case "admin":
      return "Admin";
    case "op":
      return "OP";
    case "hoo":
      return "Admin";
    default:
      return "Handler";
  }
}
