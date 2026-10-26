import { EmployeeAccountsPanel } from "@/components/admin/EmployeeAccountsPanel";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { ALPHAA_SETUP_COUNTRIES } from "@/lib/setup-options";
import { AlphaaEmployeeForm } from "./AlphaaEmployeeForm";
import type { AlphaaEmployeeProfileProps } from "@/types/admin";

function canonicalAlphaaCountry(value: string) {
  const base = baseCountryFromDisplay(value);
  return (
    ALPHAA_SETUP_COUNTRIES.find(
      (country) => country.toLowerCase() === base.toLowerCase()
    ) ?? base
  );
}

export function AlphaaEmployeeProfile({ profile }: AlphaaEmployeeProfileProps) {
  const country = canonicalAlphaaCountry(
    profile.countries[0] ?? profile.country ?? ""
  );
  const holders = [
    {
      id: profile.id,
      source: "alphaa" as const,
      full_name: profile.fullName,
      country: country || null,
      language: profile.language,
      team_lead_name: null,
      manager_name: null,
    },
  ];
  const planCount = profile.accounts.filter((account) => !account.is_spare)
    .length;

  return (
    <div className="flex flex-col gap-5">
      <AlphaaEmployeeForm
        key={[
          profile.fullName,
          profile.email,
          profile.phone ?? "",
          profile.roleLabel,
          country,
          profile.department ?? "",
          profile.location ?? "",
          profile.projects.join("|"),
          String(profile.isActive),
        ].join("::")}
        initial={{
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          phone: profile.phone ?? "",
          roleLabel: profile.roleLabel,
          country,
          department: profile.department ?? "",
          location: profile.location ?? "",
          projects: profile.projects,
          isActive: profile.isActive,
        }}
      />

      <section className="flex flex-col gap-3">
        <EmployeeAccountsPanel
          userId={profile.id}
          fullName={profile.fullName}
          country={country || null}
          language={profile.language}
          accounts={profile.accounts}
          assignedCount={planCount}
          canAdd
          canImport
          canMarkSpare
          holders={holders}
          holderSource="alphaa"
        />
      </section>
    </div>
  );
}
