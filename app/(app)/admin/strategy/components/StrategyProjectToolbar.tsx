"use client";

import { motion } from "framer-motion";
import { StrategyDeleteProjectButton } from "./StrategyDeleteProjectButton";
import { StrategyEditProjectButton } from "./StrategyEditProjectButton";
import { StrategyProjectRegionSelect } from "./StrategyProjectRegionSelect";
import type { StrategyProjectToolbarProps } from "@/types/strategy";

const fieldClass =
  "h-9 min-w-0 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function StrategyProjectToolbar({
  name,
  region,
  regionOptions,
  resources,
  resourcesLocked = false,
  editing,
  saving,
  onEdit,
  onCancel,
  onRegionChange,
  onResourcesChange,
  onSave,
  onDelete,
}: StrategyProjectToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="truncate text-[18px] font-bold tracking-tight text-[var(--color-ink)]">
        {name}
      </h2>
      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
        {editing ? (
          <>
            <StrategyProjectRegionSelect
              id={`${name}-project-region`}
              value={region}
              options={regionOptions}
              emptyLabel="None — multiple regions"
              layout="inline"
              onChange={onRegionChange}
            />
            {resourcesLocked ? (
              <p className="text-[12px] font-medium text-[var(--color-muted)]">
                Resources{" "}
                <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                  {resources}
                </span>
              </p>
            ) : (
              <label className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
                Resources
                <input
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={resources}
                  aria-label={`${name} resources`}
                  onChange={(event) =>
                    onResourcesChange(Number(event.target.value) || 0)
                  }
                  className={`${fieldClass} w-[64px] text-center tabular-nums`}
                />
              </label>
            )}
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saving}
              aria-label={`Cancel editing ${name}`}
              onClick={onCancel}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saving}
              aria-label={`Save ${name} strategy`}
              onClick={onSave}
              className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving…" : "Save project"}
            </motion.button>
          </>
        ) : (
          <>
            <p className="text-[12px] font-medium text-[var(--color-muted)]">
              Project region{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                {region || "Not set"}
              </span>
            </p>
            <p className="text-[12px] font-medium text-[var(--color-muted)]">
              Resources{" "}
              <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                {resources}
              </span>
            </p>
            <StrategyEditProjectButton name={name} onClick={onEdit} />
            <StrategyDeleteProjectButton name={name} onClick={onDelete} />
          </>
        )}
      </div>
    </div>
  );
}
