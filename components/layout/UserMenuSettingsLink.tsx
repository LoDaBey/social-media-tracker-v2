"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export function UserMenuSettingsLink() {
  return (
    <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Link
        href="/settings"
        aria-label="Open settings"
        className={[
          "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[var(--color-ink)]",
          "hover:bg-[var(--color-cream-tint)]",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        ].join(" ")}
      >
        <Settings className="h-4 w-4" aria-hidden="true" />
        Settings
      </Link>
    </motion.div>
  );
}
