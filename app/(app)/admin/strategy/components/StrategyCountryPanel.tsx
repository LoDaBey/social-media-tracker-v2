"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { targetsGrandTotal } from "@/lib/strategy-platforms";
import { StrategyHandlerEditor } from "./StrategyHandlerEditor";
import { StrategyHandlerGaps } from "./StrategyHandlerGaps";
import { StrategyProjectGaps } from "./StrategyProjectGaps";
import { StrategyTargetsGrid } from "./StrategyTargetsGrid";
import type { StrategyCountryPanelProps, StrategyScopeCounts } from "@/types/strategy";

const fieldClass =
  "h-10 w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategyCountryPanel({
  row,
  gaps,
  saving,
  onSave,
}: StrategyCountryPanelProps) {
  const [language, setLanguage] = useState(row.language);
  const [language2, setLanguage2] = useState(row.language2 ?? "");
  const [resources, setResources] = useState(row.resources);
  const [projectTargets, setProjectTargets] = useState<StrategyScopeCounts>(
    row.projectTargets
  );
  const [handlerTargets, setHandlerTargets] = useState<StrategyScopeCounts>(
    row.handlerTargets
  );

  const computedTotal = targetsGrandTotal(projectTargets);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Language
          <input
            className={fieldClass}
            value={language}
            aria-label={`${row.country} language`}
            onChange={(event) => setLanguage(event.target.value)}
          />
        </label>
        {row.book === "africa_europe" ? (
          <label className="flex flex-col gap-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Language 2
            <input
              className={fieldClass}
              value={language2}
              aria-label={`${row.country} second language`}
              onChange={(event) => setLanguage2(event.target.value)}
            />
          </label>
        ) : null}
        <label className="flex flex-col gap-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Resources
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            className={fieldClass}
            value={resources}
            aria-label={`${row.country} resources`}
            onChange={(event) => setResources(Number(event.target.value) || 0)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-[var(--color-ink)]">
          Project totals
          <span className="ml-2 text-[12px] font-medium text-[var(--color-muted)]">
            {computedTotal} accounts
          </span>
        </p>
        <StrategyTargetsGrid
          label={`${row.country} project totals`}
          value={projectTargets}
          onChange={setProjectTargets}
        />
      </div>

      <StrategyHandlerEditor value={handlerTargets} onChange={setHandlerTargets} />

      {gaps ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <StrategyProjectGaps gaps={gaps.project} />
          <StrategyHandlerGaps handlers={gaps.handlers} />
        </div>
      ) : null}

      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={saving}
        aria-label={`Save ${row.country} strategy`}
        onClick={() =>
          onSave({
            book: row.book,
            country: row.country,
            language,
            language2: language2 || null,
            region: row.region === "Alphaa" ? undefined : row.region,
            resources,
            totalAccounts: computedTotal,
            projectTargets,
            handlerTargets,
          })
        }
        className="inline-flex w-fit cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? "Saving…" : "Save country"}
      </motion.button>
    </div>
  );
}
