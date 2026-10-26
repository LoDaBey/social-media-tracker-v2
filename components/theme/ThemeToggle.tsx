"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import type { AppTheme, ThemeToggleProps } from "@/types/layout";

function subscribe() {
  return () => {};
}

function nextTheme(theme: string | undefined): AppTheme {
  if (theme === "light") return "dark";
  if (theme === "dark") return "system";
  return "light";
}

function themeLabel(theme: string | undefined) {
  if (theme === "dark") return "Dark";
  if (theme === "system") return "System";
  return "Light";
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
  const current = mounted ? theme : "light";
  const upcoming = nextTheme(current);

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      <button
        type="button"
        aria-label={`Theme: ${themeLabel(current)}. Switch to ${themeLabel(upcoming)}`}
        title={`Theme: ${themeLabel(current)}`}
        onClick={() => setTheme(upcoming)}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        {current === "dark" ? (
          <Moon className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
        ) : current === "system" ? (
          <Monitor className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
        ) : (
          <Sun className="h-5 w-5" aria-hidden="true" strokeWidth={2.25} />
        )}
      </button>
    </motion.div>
  );
}
