"use client";

import { motion } from "framer-motion";
import { CountryFlag } from "@/lib/country-icons";
import type { StrategyCountryToolbarProps } from "@/types/strategy";

const fieldClass =
  "h-9 min-w-0 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategyCountryToolbar({
  country,
  book,
  language,
  language2,
  resources,
  saving,
  onLanguageChange,
  onLanguage2Change,
  onResourcesChange,
  onSave,
}: StrategyCountryToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <CountryFlag country={country} className="h-5 w-7" />
        <h2 className="truncate text-[18px] font-bold tracking-tight text-[var(--color-ink)]">
          {country}
        </h2>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
        <label className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
          Language
          <input
            value={language}
            aria-label={`${country} language`}
            onChange={(event) => onLanguageChange(event.target.value)}
            className={`${fieldClass} w-[132px]`}
          />
        </label>
        {book === "africa_europe" ? (
          <label className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
            Language 2
            <input
              value={language2}
              aria-label={`${country} second language`}
              onChange={(event) => onLanguage2Change(event.target.value)}
              className={`${fieldClass} w-[132px]`}
            />
          </label>
        ) : null}
        <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
          Resources
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={resources}
            aria-label={`${country} resources`}
            onChange={(event) => onResourcesChange(Number(event.target.value) || 0)}
            className={`${fieldClass} w-[64px] text-center tabular-nums`}
          />
        </label>
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={saving}
          aria-label={`Save ${country} strategy`}
          onClick={onSave}
          className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save country"}
        </motion.button>
      </div>
    </div>
  );
}
