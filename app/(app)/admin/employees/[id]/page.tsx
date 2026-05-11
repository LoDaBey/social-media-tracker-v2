import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { queryOne } from "@/lib/db";
import { fetchActiveAccountCountsByPlatform, fetchTeamLeadOptions } from "@/lib/admin-data";
import { normalizePgDateColumn } from "@/lib/cairo-date";
import type { TempUser } from "@/types/db";
import { EmployeeForm, type EmployeeFormInitial } from "@/components/admin/EmployeeForm";
import { EmployeeTargetsForm } from "@/components/admin/EmployeeTargetsForm";
import { AdminEmployeeTabs } from "@/components/admin/AdminEmployeeTabs";
import { AdminEmployeeWalletEmbed } from "@/components/admin/AdminEmployeeWalletEmbed";
import { AdminEmployeeActivity } from "@/components/admin/AdminEmployeeActivity";

type SearchParams = { tab?: string };

function tabOrDefault(tab: string | undefined) {
  if (tab === "targets" || tab === "wallet" || tab === "activity") return tab;
  return "profile";
}

function roleBadge(role: string) {
  if (role === "admin") return "Admin";
  if (role === "team_lead") return "Team lead";
  return "Employee";
}

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
  const tab = tabOrDefault(typeof sp.tab === "string" ? sp.tab : undefined);

  const user = await queryOne<TempUser>(`SELECT * FROM temp_users WHERE id = $1`, [id]);
  if (!user) notFound();

  const teamLeads = await fetchTeamLeadOptions();
  const counts =
    tab === "targets"
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
    base_salary: user.base_salary,
    current_level: user.current_level,
    pay_cycle_start_date: normalizePgDateColumn(user.pay_cycle_start_date),
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
    <main className="flex flex-col gap-8">
      <nav className="text-[13px] font-medium text-[var(--color-muted)]" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link
              href="/admin"
              className="cursor-pointer rounded-lg text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              Admin
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li>
            <Link
              href="/admin/employees"
              className="cursor-pointer rounded-lg text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              Employees
            </Link>
          </li>
          <li aria-hidden="true">·</li>
          <li className="text-[var(--color-ink)]">{user.full_name}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">{user.full_name}</h1>
        <span className="rounded-full bg-[var(--color-emerald-tint)] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-emerald)]">
          {roleBadge(user.role)}
        </span>
      </div>

      <AdminEmployeeTabs userId={id} tab={typeof sp.tab === "string" ? sp.tab : undefined} />

      {tab === "profile" ? (
        <EmployeeForm key={initial.updated_at} initial={initial} teamLeads={teamLeads} />
      ) : null}

      {tab === "targets" ? (
        <EmployeeTargetsForm
          key={user.updated_at}
          userId={id}
          initial={targetsInitial}
          activeCounts={counts}
        />
      ) : null}

      {tab === "wallet" ? (
        <Suspense
          fallback={
            <div className="min-h-[200px] rounded-2xl bg-[var(--color-cream-tint)] animate-pulse" />
          }
        >
          <AdminEmployeeWalletEmbed userId={id} />
        </Suspense>
      ) : null}

      {tab === "activity" ? (
        <Suspense
          fallback={
            <div className="min-h-[200px] rounded-2xl bg-[var(--color-cream-tint)] animate-pulse" />
          }
        >
          <AdminEmployeeActivity userId={id} />
        </Suspense>
      ) : null}
    </main>
  );
}
