"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { HeaderSearchPalette } from "@/components/layout/HeaderSearchPalette";
import type { HeaderSearchProps } from "@/types/layout";

export function HeaderSearch({ people }: HeaderSearchProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const toggleChord =
        (event.key === "k" || event.key === "K") &&
        (event.metaKey || event.ctrlKey);

      if (toggleChord) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (event.key === "/" && !inField && !open) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open search"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded-md border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-muted)] sm:inline">
          /
        </kbd>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <HeaderSearchPalette
            people={people}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
