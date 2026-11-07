import { queryOne } from "@/lib/db";
import { fetchAdminAccountsByUserIds } from "@/lib/admin-accounts-data";
import { ALPHAA_SETUP_COUNTRIES } from "@/lib/setup-options";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import {
  baseCountryFromDisplay,
  mapEmployeeListCountries,
} from "@/lib/overview-country-display";
import { alphaaRoleLabelFromRole, mapAlphaaRole } from "@/lib/admin-alphaa-roles";
import type {
  AdminEmployeeListFilters,
  AdminEmployeeListRow,
  AdminSocialAccountListItem,
  AdminAlphaaEmployeeEditorBundle,
  AlphaaEmployeeProfile,
} from "@/types/admin";

export { mapAlphaaRole, alphaaRoleLabelFromRole } from "@/lib/admin-alphaa-roles";

/*
 * Main (ALPHAA) holders are temp_users with region = 'Alphaa' and their
 * accounts are in temp_social_media_accounts. Nothing here reads the old
 * Alpha tables (users / social_media_accounts).
 */

export function canonicalAlphaaCountry(value: string) {
  const base = baseCountryFromDisplay(value);
  return (
    ALPHAA_SETUP_COUNTRIES.find(
      (country) => country.toLowerCase() === base.toLowerCase()
    ) ?? base
  );
}

/** Main (ALPHAA) holders' accounts — same temp table as every other project. */
export async function fetchAlphaaAccountsByUserIds(
  userIds: number[]
): Promise<Map<number, AdminSocialAccountListItem[]>> {
  return fetchAdminAccountsByUserIds(userIds);
}

/**
 * fetchAdminEmployeesList already returns region 'Alphaa' temp_users,
 * so nothing extra is added here (it would list everyone twice).
 */
export async function fetchAlphaaEmployeesList(
  filters: AdminEmployeeListFilters
): Promise<AdminEmployeeListRow[]> {
  void filters;
  return [];
}

type AlphaaProfileQueryRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  role: string | null;
  phone: string | null;
  is_active: boolean;
  country: string | null;
  language: string | null;
};

export async function fetchAlphaaEmployeeById(
  id: number
): Promise<AlphaaEmployeeProfile | null> {
  const user = await queryOne<AlphaaProfileQueryRow>(
    `SELECT id, full_name, email, role, phone, is_active,
            NULLIF(INITCAP(TRIM(COALESCE(country, ''))), '') AS country,
            language
       FROM temp_users
      WHERE id = $1
        AND region = 'Alphaa'`,
    [id]
  );
  if (!user) return null;

  const mappedRole = mapAlphaaRole(user.role ?? "employee");
  const accountsByUser = await fetchAdminAccountsByUserIds([id]);
  const accounts = accountsByUser.get(id) ?? [];
  const countries = mapEmployeeListCountries(
    user.country ? [user.country] : [],
    { source: "alphaa", region: "Alphaa" }
  );
  return {
    id: user.id,
    fullName: user.full_name?.trim() || `Handler ${user.id}`,
    email: user.email?.trim() || "",
    roleLabel: alphaaRoleLabelFromRole(mappedRole),
    mappedRole,
    phone: user.phone,
    country: countries[0] ?? null,
    countries,
    language: user.language,
    isActive: user.is_active,
    department: null,
    location: null,
    projects: user.country ? [user.country] : [],
    accounts,
  };
}

export async function fetchAlphaaEmployeeEditorBundle(
  userId: number
): Promise<AdminAlphaaEmployeeEditorBundle | null> {
  const profile = await fetchAlphaaEmployeeById(userId);
  if (!profile) return null;

  const country = canonicalAlphaaCountry(
    profile.countries[0] ?? profile.country ?? ""
  );

  const { fetchTeamLeadOptions, fetchOpOptions, fetchAdminSupervisorOptions } =
    await import("@/lib/admin-data");
  const { fetchManagerOptions } = await import("@/lib/manager-data");
  const [teamLeads, managers, ops, admins] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
    fetchOpOptions(),
    fetchAdminSupervisorOptions(),
  ]);

  return {
    source: "alphaa",
    projectLabel: MAIN_PROJECT_LABEL,
    fetchedAt: new Date().toISOString(),
    fullName: profile.fullName,
    role: profile.mappedRole,
    profile: {
      id: profile.id,
      full_name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      role: profile.mappedRole,
      is_active: profile.isActive,
      employee_code: null,
      employment_status: profile.isActive ? "active" : "deactivated",
      hire_date: "",
      team_lead_id: null,
      manager_id: null,
      op_id: null,
      manager_countries: [],
      op_project_slug: "",
      op_countries: [],
      current_level: 2,
      country,
      updated_at: new Date().toISOString(),
    },
    teamLeads,
    managers,
    ops,
    admins,
  };
}
