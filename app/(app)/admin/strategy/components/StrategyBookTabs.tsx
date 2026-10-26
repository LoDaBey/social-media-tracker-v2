"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { StrategyBook, StrategyBookTabsProps } from "@/types/strategy";

const TABS: { book: StrategyBook; label: string }[] = [
  { book: "alphaa", label: "ALPHAA" },
  { book: "africa_europe", label: "Africa & Balkans" },
];

export function StrategyBookTabs({ book }: StrategyBookTabsProps) {
  const router = useRouter();

  return (
    <div
      className="inline-flex rounded-full bg-[var(--color-cream-tint)] p-1"
      role="tablist"
      aria-label="Strategy books"
    >
      {TABS.map((tab) => {
        const selected = tab.book === book;
        return (
          <motion.button
            key={tab.book}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Show ${tab.label} strategy`}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/admin/strategy?book=${tab.book}`)}
            className={[
              "cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              selected
                ? "bg-[var(--color-surface)] text-[var(--color-ink)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {tab.label}
          </motion.button>
        );
      })}
    </div>
  );
}
