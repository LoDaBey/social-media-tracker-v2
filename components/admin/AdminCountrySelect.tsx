"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import { ALL_SETUP_COUNTRIES } from "@/lib/setup-options";
import type { AdminCountrySelectProps } from "@/types/admin";

export function AdminCountrySelect({
  value,
  onChange,
  countries,
  disabled = false,
  ariaLabel = "Select a country",
  ariaInvalid,
  ariaDescribedBy,
  invalid = false,
}: AdminCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const options = useMemo(
    () =>
      [...(countries ?? ALL_SETUP_COUNTRIES)].sort((a, b) => a.localeCompare(b)),
    [countries]
  );
  const selected = options.find((country) => country === value) ?? "";

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
    <div ref={rootRef} className="relative w-full">
      <motion.button
        type="button"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        layout
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={`flex w-full items-center justify-between gap-2 rounded outline-none border bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer"
        } ${
          invalid
            ? "border-[var(--color-coral)] focus-visible:ring-[var(--color-coral)]"
            : "border-[var(--color-hairline)]"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <CountryFlag country={selected} title={selected} className="h-4 w-6" />
          ) : null}
          <span className={selected ? "truncate" : "truncate text-[var(--color-muted)]"}>
            {selected || "Select a country"}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </motion.button>

      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Countries"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] py-1 shadow-lg"
        >
          {options.map((country) => {
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
