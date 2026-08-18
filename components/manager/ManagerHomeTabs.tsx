"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ManagerHomeTab, ManagerHomeTabsProps } from "@/types/manager";

export function ManagerHomeTabs({
  teamPanel,
  coveragePanel,
}: ManagerHomeTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: ManagerHomeTab =
    searchParams.get("tab") === "coverage" ? "coverage" : "team";

  function selectTab(next: ManagerHomeTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "coverage") params.set("tab", "coverage");
    else params.delete("tab");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="w-full">
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

      <div className="mt-6" role="tabpanel">
        {tab === "coverage" ? coveragePanel : teamPanel}
      </div>
    </div>
  );
}
