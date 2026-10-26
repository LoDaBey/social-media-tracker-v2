"use client";

import { motion } from "framer-motion";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import {
  emptySpareAccountFilters,
  spareAccountFiltersActive,
  spareCategoryOptions,
  sparePlatformOptions,
  spareProjectOptions,
} from "@/lib/admin-spare";
import type { SpareAccountsFiltersProps } from "@/types/admin";

const fieldClass =
  "h-11 cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function SpareAccountsFilters({
  accounts,
  holders,
  value,
  onChange,
}: SpareAccountsFiltersProps) {
  const projects = spareProjectOptions(accounts, holders);
  const platforms = sparePlatformOptions(accounts);
  const categories = spareCategoryOptions(accounts);
  const platformInOptions = platforms.some(
    (option) => option.value === value.platform
  );
  const filtersActive = spareAccountFiltersActive(value);

  return (
    <section
      aria-label="Spare account filters"
      className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
        Project
        <select
          value={value.project}
          aria-label="Filter spare accounts by project"
          onChange={(event) =>
            onChange({ ...value, project: event.target.value })
          }
          className={fieldClass}
        >
          <option value="">All projects</option>
          {value.project &&
          !projects.some((project) => project === value.project) ? (
            <option value={value.project}>{value.project}</option>
          ) : null}
          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
        Platform
        <select
          value={value.platform}
          aria-label="Filter spare accounts by platform"
          onChange={(event) =>
            onChange({ ...value, platform: event.target.value })
          }
          className={fieldClass}
        >
          <option value="">All platforms</option>
          {value.platform && !platformInOptions ? (
            <option value={value.platform}>
              {extractPlatformLabel(value.platform)}
            </option>
          ) : null}
          {platforms.map((platform) => (
            <option key={platform.value} value={platform.value}>
              {platform.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
        Category
        <select
          value={value.category}
          aria-label="Filter spare accounts by category"
          onChange={(event) =>
            onChange({ ...value, category: event.target.value })
          }
          className={fieldClass}
        >
          <option value="">All categories</option>
          {value.category && !categories.includes(value.category) ? (
            <option value={value.category}>{value.category}</option>
          ) : null}
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end">
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!filtersActive}
          aria-label="Reset spare account filters"
          onClick={() => onChange(emptySpareAccountFilters())}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </motion.button>
      </div>
    </section>
  );
}
