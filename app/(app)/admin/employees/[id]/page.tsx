import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdminPageAccess } from "@/lib/admin-access";
import { queryOne } from "@/lib/db";
import {
  fetchActiveAccountCountsByPlatform,
  fetchAdminSupervisorOptions,
  fetchManagerCountriesForUser,
  fetchOpCountriesForUser,
  fetchOpOptions,
  fetchTeamLeadOptions,
} from "@/lib/admin-data";
import { fetchEmployeeCreateProjectOptions } from "@/lib/employee-create-projects-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import type { TempUser } from "@/types/db";
import type { EmployeeFormInitial } from "@/types/admin";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { EmployeeTargetsForm } from "@/components/admin/EmployeeTargetsForm";
import { AdminEmployeeActivity } from "@/components/admin/AdminEmployeeActivity";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import {
  adminViewEmployee,
  resolveAdminEmployeePanel,
} from "@/lib/admin-view";

type SearchParams = { panel?: string; tab?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return { title: "Employee" };
  const user = await queryOne<Pick<TempUser, "full_name">>(
    `SELECT full_name FROM temp_users WHERE id = $1`,
    [id]
  );
  return { title: user?.full_name ?? "Employee" };
}

export default async function AdminEmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminPageAccess("employees");

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const sp = (await searchParams) ?? {};
  const panel = resolveAdminEmployeePanel({
    panel: typeof sp.panel === "string" ? sp.panel : undefined,
    tab: typeof sp.tab === "string" ? sp.tab : undefined,
  });

  const user = await queryOne<TempUser>(`SELECT * FROM temp_users WHERE id = $1`, [id]);
  if (!user) notFound();

  const [teamLeads, managers, ops, admins, managerCountries, opCountries, projects] =
    await Promise.all([
      fetchTeamLeadOptions(),
      fetchManagerOptions(),
      fetchOpOptions(),
      fetchAdminSupervisorOptions(),
      user.role === "manager"
        ? fetchManagerCountriesForUser(id)
        : Promise.resolve([] as string[]),
      user.role === "op"
        ? fetchOpCountriesForUser(id)
        : Promise.resolve([] as string[]),
      fetchEmployeeCreateProjectOptions(),
    ]);
  const counts =
    panel === "targets"
      ? await fetchActiveAccountCountsByPlatform(id)
      : ({} as Record<string, number>);

  const initial: EmployeeFormInitial = {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    is_active: user.is_active,
    employee_code: user.employee_code,
    employment_status: user.employment_status ?? "active",
    hire_date: normalizePgDateColumn(user.hire_date) ?? "",
    team_lead_id: user.team_lead_id,
    manager_id: user.manager_id,
    op_id: user.op_id ?? null,
    manager_countries: managerCountries,
    op_project_slug: user.op_project_slug ?? "",
    op_countries: opCountries,
    current_level: user.current_level,
    country: user.country ?? "",
    updated_at: user.updated_at,
  };

  const targetsInitial = {
    target_x_count: user.target_x_count,
    target_facebook_personal_count: user.target_facebook_personal_count,
    target_facebook_umbrella_count: user.target_facebook_umbrella_count,
    target_instagram_count: user.target_instagram_count,
    target_tiktok_count: user.target_tiktok_count,
  };

  return (
    <AdminWorkspace
      view={adminViewEmployee({
        employeeId: id,
        employeeName: user.full_name,
        role: user.role,
        panel,
      })}
    >
      {panel === "profile" ? (
        <EmployeeForm
          key={initial.updated_at}
          initial={initial}
          teamLeads={teamLeads}
          managers={managers}
          ops={ops}
          admins={admins}
          projects={projects}
        />
      ) : null}

      {panel === "targets" ? (
        <EmployeeTargetsForm
          key={user.updated_at}
          userId={id}
          initial={targetsInitial}
          activeCounts={counts}
        />
      ) : null}

      {panel === "activity" ? (
        <Suspense
          fallback={
            <div className="min-h-[200px] rounded-2xl bg-[var(--color-cream-tint)] animate-pulse" />
          }
        >
          <AdminEmployeeActivity userId={id} />
        </Suspense>
      ) : null}
    </AdminWorkspace>
  );
}
