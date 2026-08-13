import { notFound } from "next/navigation";
import { Suspense } from "react";
import { queryOne } from "@/lib/db";
import {
  fetchActiveAccountCountsByPlatform,
  fetchManagerCountriesForUser,
  fetchTeamLeadOptions,
} from "@/lib/admin-data";
import { fetchManagerOptions } from "@/lib/manager-data";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import type { TempUser } from "@/types/db";
import type { EmployeeFormInitial } from "@/types/admin";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { EmployeeTargetsForm } from "@/components/admin/EmployeeTargetsForm";
import { AdminEmployeeWalletEmbed } from "@/components/admin/AdminEmployeeWalletEmbed";
import { AdminEmployeeActivity } from "@/components/admin/AdminEmployeeActivity";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import {
  adminViewEmployee,
  resolveAdminEmployeePanel,
} from "@/lib/admin-view";

type SearchParams = { panel?: string; tab?: string };

export default async function AdminEmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<SearchParams>;
}) {
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

  const [teamLeads, managers, managerCountries] = await Promise.all([
    fetchTeamLeadOptions(),
    fetchManagerOptions(),
    user.role === "manager"
      ? fetchManagerCountriesForUser(id)
      : Promise.resolve([] as string[]),
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
    hire_date: normalizePgDateColumn(user.hire_date) ?? "",
    team_lead_id: user.team_lead_id,
    manager_id: user.manager_id,
    manager_countries: managerCountries,
    base_salary: user.base_salary,
    current_level: user.current_level,
    pay_cycle_start_date: normalizePgDateColumn(user.pay_cycle_start_date),
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

      {panel === "wallet" ? (
        <Suspense
          fallback={
            <div className="min-h-[200px] rounded-2xl bg-[var(--color-cream-tint)] animate-pulse" />
          }
        >
          <AdminEmployeeWalletEmbed userId={id} />
        </Suspense>
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
