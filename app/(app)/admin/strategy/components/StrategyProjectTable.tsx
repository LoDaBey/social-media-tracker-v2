"use client";

import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { platformTotal } from "@/lib/strategy-platforms";
import { Fragment } from "react";
import { StrategyCountryPanel } from "./StrategyCountryPanel";
import type { StrategyProjectTableProps } from "@/types/strategy";

export function StrategyProjectTable({
  book,
  rows,
  expandedCountry,
  onToggle,
  savingCountry,
  onSave,
  gapsByCountry,
}: StrategyProjectTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 py-6 text-center text-[14px] text-[var(--color-muted)]">
        No strategy rows yet. Upload the client Excel to load{" "}
        {book === "alphaa" ? "ALPHAA" : "Africa and Balkans"} countries.
      </p>
    );
  }

  const grandTotal = rows.reduce((sum, row) => sum + row.totalAccounts, 0);
  const resources = rows.reduce((sum, row) => sum + row.resources, 0);

  return (
    <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-3 py-2.5">
              Country
            </th>
            <th scope="col" className="px-3 py-2.5">
              Language
            </th>
            <th scope="col" className="px-3 py-2.5">
              Resources
            </th>
            <th scope="col" className="px-3 py-2.5">
              X
            </th>
            <th scope="col" className="px-3 py-2.5">
              Facebook
            </th>
            <th scope="col" className="px-3 py-2.5">
              Instagram
            </th>
            <th scope="col" className="px-3 py-2.5">
              TikTok
            </th>
            <th scope="col" className="px-3 py-2.5">
              Total
            </th>
            <th scope="col" className="px-3 py-2.5">
              Missing
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const expanded = expandedCountry === row.country;
            const gaps = gapsByCountry[row.country];
            const missing = gaps?.project.lines.reduce((sum, line) => sum + line.missing, 0) ?? 0;
            return (
              <Fragment key={row.country}>
                <tr className="border-t border-[var(--color-hairline)]">
                  <th scope="row" className="px-3 py-2.5">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={`${expanded ? "Collapse" : "Expand"} ${row.country} strategy`}
                      onClick={() => onToggle(row.country)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg text-left text-[14px] font-semibold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                    >
                      <ChevronDown
                        className={[
                          "h-4 w-4 text-[var(--color-muted)] transition-transform",
                          expanded ? "rotate-180" : "",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                      <CountryFlag country={row.country} />
                      {row.country}
                    </button>
                  </th>
                  <td className="px-3 py-2.5 text-[13px] text-[var(--color-muted)]">
                    {row.language}
                    {row.language2 ? ` / ${row.language2}` : ""}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-ink)]">
                    {row.resources}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-ink)]">
                    {platformTotal(row.projectTargets, "twitter")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-ink)]">
                    {platformTotal(row.projectTargets, "facebook")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-ink)]">
                    {platformTotal(row.projectTargets, "instagram")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-ink)]">
                    {platformTotal(row.projectTargets, "tiktok")}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
                    {row.totalAccounts}
                  </td>
                  <td className="px-3 py-2.5 text-[13px] tabular-nums text-[var(--color-coral)]">
                    {missing > 0 ? missing : "—"}
                  </td>
                </tr>
                {expanded ? (
                  <tr className="border-t border-[var(--color-hairline)] bg-[var(--color-cream-tint)]/50">
                    <td colSpan={9} className="px-4 py-4">
                      <StrategyCountryPanel
                        key={`${row.country}-${row.updatedAt}`}
                        row={row}
                        gaps={gaps}
                        saving={savingCountry === row.country}
                        onSave={onSave}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--color-hairline)] bg-[var(--color-cream-tint)]">
            <th
              scope="row"
              className="px-3 py-2.5 text-[13px] font-extrabold text-[var(--color-ink)]"
            >
              Total
            </th>
            <td className="px-3 py-2.5 text-[13px] text-[var(--color-muted)]">—</td>
            <td className="px-3 py-2.5 text-[13px] font-semibold tabular-nums">
              {resources}
            </td>
            <td colSpan={4} />
            <td className="px-3 py-2.5 text-[13px] font-extrabold tabular-nums">
              {grandTotal}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
