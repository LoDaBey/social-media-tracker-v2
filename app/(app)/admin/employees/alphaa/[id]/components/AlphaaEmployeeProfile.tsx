import type { ReactNode } from "react";
import { EmployeeAccountsTable } from "@/components/admin/EmployeeAccountsTable";
import { EmployeeCountryCell } from "@/components/admin/EmployeeCountryCell";
import { EmployeeStatusBadge } from "@/components/admin/EmployeeStatusBadge";
import { adminRoleBadge } from "@/lib/admin-view";
import type { AlphaaEmployeeProfileProps } from "@/types/admin";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <div className="text-[14px] font-medium text-[var(--color-ink)]">{children}</div>
    </div>
  );
}

export function AlphaaEmployeeProfile({ profile }: AlphaaEmployeeProfileProps) {
  const planCount = profile.accounts.filter((account) => !account.is_spare).length;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-5">
        <p className="text-[13px] font-semibold text-[var(--color-ink)]">
          ALPHAA profile
        </p>
        <p className="mt-1 text-[13px] text-[var(--color-muted)]">
          Read-only record from the ALPHAA users table.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name">{profile.fullName}</Field>
          <Field label="Email">{profile.email || "—"}</Field>
          <Field label="Role">
            {profile.roleLabel} · {adminRoleBadge(profile.mappedRole)}
          </Field>
          <Field label="Phone">{profile.phone || "—"}</Field>
          <Field label="Language">{profile.language || "—"}</Field>
          <Field label="Status">
            <EmployeeStatusBadge
              status={profile.isActive ? "active" : "deactivated"}
            />
          </Field>
          <Field label="Department">{profile.department || "—"}</Field>
          <Field label="Location">{profile.location || "—"}</Field>
          <Field label="Countries">
            {profile.countries.length > 0 ? (
              <EmployeeCountryCell countries={profile.countries} />
            ) : (
              "—"
            )}
          </Field>
          <Field label="Projects">
            {profile.projects.length > 0 ? profile.projects.join(", ") : "—"}
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold text-[var(--color-ink)]">
          Social accounts
          <span className="ml-2 text-[12px] font-medium text-[var(--color-muted)]">
            {planCount} {planCount === 1 ? "account" : "accounts"}
          </span>
        </p>
        {profile.accounts.length === 0 ? (
          <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-6 text-center text-[14px] text-[var(--color-muted)]">
            No social accounts are linked to {profile.fullName}.
          </p>
        ) : (
          <EmployeeAccountsTable
            userId={profile.id}
            fullName={profile.fullName}
            accounts={profile.accounts}
            readOnly
          />
        )}
      </section>
    </div>
  );
}
