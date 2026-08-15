"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { AccountTotalsCell } from "@/components/admin/AccountTotalsCell";
import { ManagerSetupActionButton } from "@/components/manager/ManagerSetupActionButton";
import { ManagerAccountsPanel } from "@/components/manager/ManagerAccountsPanel";
import type { ManagerTeamRowProps } from "@/types/manager";

export function ManagerTeamRow({ row }: ManagerTeamRowProps) {
  const [expanded, setExpanded] = useState(false);
  const setupHref = `/manager/setup?employeeId=${row.id}`;
  const canOpenSetup = !row.setupComplete;
  const panelId = `manager-accounts-${row.id}`;

  function toggle() {
    setExpanded((prev) => !prev);
  }

  return (
    <>
      <tr
        className="cursor-pointer border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)] last:border-b-0 hover:bg-[var(--color-emerald-tint)]/40"
        onClick={toggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={
                expanded
                  ? `Hide accounts for ${row.full_name}`
                  : `Show accounts for ${row.full_name}`
              }
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <CountryFlag country={row.country} className="h-5 w-7" />
            <span className="text-[14px] font-semibold text-[var(--color-ink)]">
              {row.country}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-[14px] font-semibold text-[var(--color-ink)]">
          {canOpenSetup ? (
            <Link
              href={setupHref}
              aria-label={`Add accounts for ${row.full_name}`}
              className="rounded-lg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              onClick={(event) => event.stopPropagation()}
            >
              {row.full_name}
            </Link>
          ) : (
            <span>{row.full_name}</span>
          )}
        </td>
        <td className="hidden px-4 py-3 text-[14px] text-[var(--color-muted)] sm:table-cell">
          {row.email}
        </td>
        <td className="px-4 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
          {row.targetAccountsSum}
        </td>
        <td className="px-4 py-3">
          <AccountTotalsCell
            added={row.accountTotal}
            assigned={row.targetAccountsSum}
          />
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] ${
              row.setupComplete
                ? "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
                : "bg-[var(--color-coral-tint)] text-[var(--color-coral)]"
            }`}
          >
            {row.setupComplete ? "Complete" : "Needs setup"}
          </span>
        </td>
        <td className="px-4 py-3">
          <ManagerSetupActionButton
            href={setupHref}
            setupComplete={row.setupComplete}
            fullName={row.full_name}
          />
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/70 last:border-b-0">
          <td
            colSpan={7}
            className="px-4 py-4"
            id={panelId}
            onClick={(event) => event.stopPropagation()}
          >
            <ManagerAccountsPanel
              holderId={row.id}
              fullName={row.full_name}
              country={row.country}
              language={row.language}
              accounts={row.accounts}
              assignedCount={row.targetAccountsSum}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
