"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import type { EmployeesToolbarSelectProps } from "@/types/admin";

export function EmployeesToolbarSelect({
  label,
  value,
  ariaLabel,
  allLabel,
  options,
  onChange,
}: EmployeesToolbarSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);
  const display = selected?.label ?? allLabel;

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
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <span className="font-medium text-[var(--color-muted)]">{label}</span>
        <span className="flex min-w-0 items-center gap-1.5 font-semibold text-[var(--color-ink)]">
          {selected?.country ? (
            <CountryFlag
              country={selected.country}
              title={selected.label}
              className="h-3.5 w-5"
            />
          ) : null}
          <span className="truncate">{display}</span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[var(--color-muted)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </motion.button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-30 mt-1 max-h-72 min-w-[180px] overflow-y-auto rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] py-1 shadow-[0_12px_32px_rgba(20,20,20,.12)]"
        >
          <li role="option" aria-selected={!selected}>
            <button
              type="button"
              onClick={() => choose("")}
              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium outline-none hover:bg-[var(--color-cream-tint)] focus-visible:bg-[var(--color-cream-tint)] ${
                !selected
                  ? "text-[var(--color-emerald)]"
                  : "text-[var(--color-ink)]"
              }`}
            >
              {allLabel}
            </button>
          </li>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => choose(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium outline-none hover:bg-[var(--color-cream-tint)] focus-visible:bg-[var(--color-cream-tint)] ${
                    isSelected
                      ? "text-[var(--color-emerald)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  {option.country ? (
                    <CountryFlag
                      country={option.country}
                      title={option.label}
                      className="h-4 w-6"
                    />
                  ) : null}
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
