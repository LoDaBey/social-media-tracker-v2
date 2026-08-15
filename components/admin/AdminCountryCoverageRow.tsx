"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { AdminCoverageCountCell } from "@/components/admin/AdminCoverageCountCell";
import { AdminCountryHolderGapsTable } from "@/components/admin/AdminCountryHolderGapsTable";
import type { AdminCountryCoverageRowProps } from "@/types/admin";

export function AdminCountryCoverageRow({ row }: AdminCountryCoverageRowProps) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const missingEmployees = Math.max(0, row.resources.target - row.resources.actual);

  return (
    <>
      <tr
        className="cursor-pointer border-t border-[var(--color-hairline)] hover:bg-[var(--color-emerald-tint)]/30"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <th scope="row" className="px-3 py-2.5">
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-expanded={expanded}
              aria-controls={panelId}
              aria-label={
                expanded
                  ? `Hide account holders for ${row.country}`
                  : `Show account holders and gaps for ${row.country}`
              }
              onClick={(event) => {
                event.stopPropagation();
                setExpanded((prev) => !prev);
              }}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </motion.button>
            <CountryFlag country={row.country} title={row.country} className="h-4 w-6" />
            <span className="text-[13px] font-semibold text-[var(--color-ink)]">
              {row.country}
            </span>
            {row.onPlan ? null : (
              <span className="text-[11px] font-medium text-[#E08A2C]">Off plan</span>
            )}
          </div>
        </th>
        <td className="px-3 py-2.5 text-[13px] text-[var(--color-muted)]">
          {row.language}
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell count={row.resources} label={`${row.country} employees`} />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell count={row.x} label={`${row.country} X accounts`} />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell
            count={row.facebookPersonal}
            label={`${row.country} Facebook personal accounts`}
          />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell
            count={row.facebookUmbrella}
            label={`${row.country} Facebook umbrella accounts`}
          />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell
            count={row.instagram}
            label={`${row.country} Instagram accounts`}
          />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell
            count={row.tiktok}
            label={`${row.country} TikTok accounts`}
          />
        </td>
        <td className="px-3 py-2.5">
          <AdminCoverageCountCell
            count={row.totalAccounts}
            label={`${row.country} total accounts`}
          />
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/40">
          <td
            colSpan={9}
            className="px-3 py-3"
            id={panelId}
            onClick={(event) => event.stopPropagation()}
          >
            <AdminCountryHolderGapsTable
              country={row.country}
              holders={row.holders}
              missingEmployees={missingEmployees}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
