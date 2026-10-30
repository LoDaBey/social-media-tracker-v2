"use client";

import { motion } from "framer-motion";
import { STRATEGY_PLATFORM_SHORT_LABELS, STRATEGY_SCOPE_LABELS } from "@/lib/strategy-platforms";
import { StrategyPlatformIcon } from "./StrategyPlatformIcon";
import type { StrategyProjectGapsProps } from "@/types/strategy";

export function StrategyProjectGaps({ gaps, onSelectPlatform }: StrategyProjectGapsProps) {
  if (gaps.lines.length === 0) {
    return (
      <p className="px-1 text-[13px] text-[var(--color-muted)]">
        Country total is complete ({gaps.totalPlanned} accounts).
      </p>
    );
  }

  const missing = gaps.lines.reduce((sum, line) => sum + line.missing, 0);

  return (
    <section
      aria-label="Missing accounts"
      className="overflow-x-hidden rounded-[14px] bg-[var(--color-coral-tint)] px-3 py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12px] font-semibold text-[var(--color-coral)]">Missing</p>
        <p className="text-[22px] font-bold leading-none tabular-nums text-[var(--color-coral)]">
          {missing}
        </p>
      </div>
      <ul className="mt-2 max-h-48 overflow-x-hidden overflow-y-auto">
        {gaps.lines.map((line) => {
          const scopeLabel =
            line.scope === "all" ? "" : ` · ${STRATEGY_SCOPE_LABELS[line.scope]}`;
          const label = `${STRATEGY_PLATFORM_SHORT_LABELS[line.platform]}${scopeLabel}`;

          return (
            <li key={`${line.platform}-${line.scope}`} className="min-w-0 overflow-hidden">
              <motion.button
                type="button"
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={`Show ${label} gap`}
                onClick={() => onSelectPlatform?.(line.platform)}
                className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-left outline-none hover:bg-[var(--color-surface)]/50 focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
              >
                <StrategyPlatformIcon platform={line.platform} className="h-5 w-5" />
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--color-ink)]">
                  {label}
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-[var(--color-coral)]">
                  {line.missing}
                </span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
