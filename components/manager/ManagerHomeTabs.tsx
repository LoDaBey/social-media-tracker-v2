"use client";

import { motion } from "framer-motion";
import { useInstantSearchParams } from "@/hooks/useInstantSearchParams";
import type { ManagerHomeTab, ManagerHomeTabsProps } from "@/types/manager";

export function ManagerHomeTabs({
  teamPanel,
  coveragePanel,
  actions,
}: ManagerHomeTabsProps) {
  const { params, update } = useInstantSearchParams();
  const tab: ManagerHomeTab =
    params.get("tab") === "coverage" ? "coverage" : "team";

  function selectTab(next: ManagerHomeTab) {
    update({ tab: next === "coverage" ? "coverage" : null });
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-full bg-[var(--color-cream-tint)] p-1"
          role="tablist"
          aria-label="Manager sections"
        >
          <motion.button
            type="button"
            role="tab"
            aria-selected={tab === "team"}
            aria-label="Show your team"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectTab("team")}
            className={`cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              tab === "team"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            Team
          </motion.button>
          <motion.button
            type="button"
            role="tab"
            aria-selected={tab === "coverage"}
            aria-label="Show planned coverage"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectTab("coverage")}
            className={`cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              tab === "coverage"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            Planned coverage
          </motion.button>
        </div>
        {actions}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "coverage" ? coveragePanel : teamPanel}
      </div>
    </div>
  );
}
