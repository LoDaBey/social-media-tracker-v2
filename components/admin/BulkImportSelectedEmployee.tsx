import type { ReactNode } from "react";
import { CountryFlag } from "@/lib/country-icons";
import type { BulkImportSelectedEmployeeProps } from "@/types/admin";

function Value({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <p className="truncate text-[13px] font-medium text-[var(--color-ink)]">
        {children}
      </p>
    </div>
  );
}

export function BulkImportSelectedEmployee({
  holder,
}: BulkImportSelectedEmployeeProps) {
  return (
    <div className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-3">
      <p className="text-[12px] font-semibold text-[var(--color-ink)]">
        {holder.full_name}
        {holder.source === "alphaa" ? " · ALPHAA" : ""}
      </p>
      <p className="mt-1 text-[12px] text-[var(--color-muted)]">
        New accounts replace this person&apos;s current social accounts. Role,
        team lead, and manager stay the same.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Value label="Country">
          {holder.country ? (
            <span className="inline-flex items-center gap-2">
              <CountryFlag
                country={holder.country}
                title={holder.country}
                className="h-4 w-6"
              />
              {holder.country}
            </span>
          ) : (
            "—"
          )}
        </Value>
        <Value label="Language">{holder.language || "—"}</Value>
        <Value label="Team lead">{holder.team_lead_name || "—"}</Value>
        <Value label="Manager">{holder.manager_name || "—"}</Value>
      </div>
    </div>
  );
}
