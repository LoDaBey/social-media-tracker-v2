"use client";

import { LayoutGroup, motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  adminRegionFromStrategySlug,
  adminRegionSlug,
} from "@/lib/region-config";
import type {
  AdminOverviewRegionTabsProps,
  AdminRegion,
} from "@/types/admin";

export function AdminOverviewRegionTabs({
  region,
  projects,
  children,
}: AdminOverviewRegionTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabs: { region: AdminRegion; slug: string; label: string }[] = [
    { region: "Overview", slug: "overview", label: "All regions" },
    ...projects.map((project) => {
      const nextRegion = adminRegionFromStrategySlug(project.slug);
      return {
        region: nextRegion,
        slug: adminRegionSlug(nextRegion),
        label: project.name,
      };
    }),
  ];

  function selectRegion(next: AdminRegion) {
    const params = new URLSearchParams(searchParams.toString());
    const slug = adminRegionSlug(next);
    if (slug === "overview") params.delete("region");
    else params.set("region", slug);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="w-full">
      <LayoutGroup id="admin-region-tabs">
        <div
          className="inline-flex max-w-full flex-wrap rounded-full bg-[var(--color-cream-tint)] p-1"
          role="tablist"
          aria-label="Admin coverage regions"
        >
          {tabs.map((tab) => {
            const selected = region === tab.region;

            return (
              <motion.button
                key={tab.slug}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Show ${tab.label} coverage`}
                layout
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectRegion(tab.region)}
                className={`relative cursor-pointer rounded-full px-5 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                  selected
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {selected ? (
                  <motion.span
                    layoutId="admin-region-tab"
                    className="absolute inset-0 rounded-full bg-[var(--color-surface)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:gap-5" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
