"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { STRATEGY_TABS } from "@/lib/strategy-tabs";
import type { StrategyBookTabsProps } from "@/types/strategy";

export function StrategyBookTabs({ tab }: StrategyBookTabsProps) {
  const router = useRouter();

  return (
    <div
      className="inline-flex flex-wrap rounded-full bg-[var(--color-cream-tint)] p-1"
      role="tablist"
      aria-label="Strategy books"
    >
      {STRATEGY_TABS.map((item) => {
        const selected = item.tab === tab;
        return (
          <motion.button
            key={item.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Show ${item.label} strategy`}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/admin/strategy?book=${item.tab}`)}
            className={[
              "cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              selected
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {item.label}
          </motion.button>
        );
      })}
    </div>
  );
}
