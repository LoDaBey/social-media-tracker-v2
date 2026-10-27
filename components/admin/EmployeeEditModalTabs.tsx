"use client";

import { motion } from "framer-motion";
import { adminEmployeePanelsForSource } from "@/lib/admin-view";
import type { EmployeeEditModalTabsProps } from "@/types/admin";

export function EmployeeEditModalTabs({
  panel,
  onChange,
  source,
}: EmployeeEditModalTabsProps) {
  const panels = adminEmployeePanelsForSource(source);

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Employee sections"
    >
      {panels.map((item) => {
        const selected = panel === item.id;
        return (
          <motion.button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Show ${item.label} section`}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(item.id)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              selected
                ? "bg-[var(--color-emerald)] text-white"
                : "bg-[var(--color-cream-tint)] text-[var(--color-ink)] hover:bg-[var(--color-hairline)]"
            }`}
          >
            {item.label}
          </motion.button>
        );
      })}
    </div>
  );
}
