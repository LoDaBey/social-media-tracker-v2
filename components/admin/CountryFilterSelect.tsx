"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { SETUP_COUNTRIES } from "@/lib/setup-options";
import type { CountryFilterSelectProps } from "@/types/admin";

export function CountryFilterSelect({
  value,
  onChange,
}: CountryFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = SETUP_COUNTRIES.find((country) => country === value) ?? "";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-[200px]">
      <motion.button
        type="button"
        aria-label="Filter by country"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        layout
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <CountryFlag country={selected} title={selected} className="h-4 w-6" />
          ) : null}
          <span className="truncate">{selected || "All countries"}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </motion.button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Countries"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          <li role="option" aria-selected={!selected}>
            <button
              type="button"
              onClick={() => choose("")}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium outline-none hover:bg-[var(--color-cream-tint)] focus-visible:bg-[var(--color-cream-tint)] ${
                !selected ? "text-[var(--color-emerald)]" : "text-[var(--color-ink)]"
              }`}
            >
              All countries
            </button>
          </li>
          {SETUP_COUNTRIES.map((country) => {
            const isSelected = country === selected;
            return (
              <li key={country} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(country)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium outline-none hover:bg-[var(--color-cream-tint)] focus-visible:bg-[var(--color-cream-tint)] ${
                    isSelected
                      ? "text-[var(--color-emerald)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  <CountryFlag country={country} title={country} className="h-4 w-6" />
                  {country}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
