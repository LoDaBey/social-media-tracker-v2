"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  AdminOverviewRegionTabsProps,
  AdminRegion,
  AdminRegionSlug,
} from "@/types/admin";

const TABS: { region: AdminRegion; slug: AdminRegionSlug; label: string }[] = [
  { region: "Overview", slug: "overview", label: "Overview" },
  { region: "Africa", slug: "africa", label: "Africa" },
  { region: "Balkan", slug: "balkan", label: "Balkan" },
];

export function AdminOverviewRegionTabs({
  region,
  children,
}: AdminOverviewRegionTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function selectRegion(next: AdminRegion) {
    const params = new URLSearchParams(searchParams.toString());
    const slug = TABS.find((tab) => tab.region === next)?.slug ?? "overview";
    if (slug === "overview") params.delete("region");
    else params.set("region", slug);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="w-full">
      <div
        className="inline-flex rounded-full bg-[var(--color-cream-tint)] p-1"
        role="tablist"
        aria-label="Admin coverage regions"
      >
        {TABS.map((tab) => (
          <motion.button
            key={tab.slug}
            type="button"
            role="tab"
            aria-selected={region === tab.region}
            aria-label={`Show ${tab.label} coverage`}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => selectRegion(tab.region)}
            className={`cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              region === tab.region
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:gap-5" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
