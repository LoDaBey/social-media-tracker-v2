"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { strategyHrefForProject } from "@/lib/strategy-tabs";
import type { StrategyBookTabsProps } from "@/types/strategy";

function TabButton({
  label,
  selected,
  href,
}: {
  label: string;
  selected: boolean;
  href: string;
}) {
  const router = useRouter();

  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={`Show ${label} strategy`}
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push(href)}
      className={[
        "cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        selected
          ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[0_4px_14px_rgba(20,20,20,.08)]"
          : "text-[var(--color-muted)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {label}
    </motion.button>
  );
}

export function StrategyBookTabs({ selectedSlug, projects }: StrategyBookTabsProps) {
  if (projects.length === 0) return null;

  return (
    <div
      className="inline-flex flex-wrap rounded-full bg-[var(--color-cream-tint)] p-1"
      role="tablist"
      aria-label="Strategy projects"
    >
      {projects.map((project) => (
        <TabButton
          key={project.slug}
          label={project.name}
          selected={selectedSlug === project.slug}
          href={strategyHrefForProject(project.slug)}
        />
      ))}
    </div>
  );
}
