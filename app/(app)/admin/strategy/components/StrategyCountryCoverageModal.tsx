"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AdminCountryCoverageDetail } from "@/components/admin/AdminCountryCoverageDetail";
import { CountryFlag } from "@/lib/country-icons";
import { useCountryCoverage } from "@/hooks/useCountryCoverage";
import type { StrategyCountryCoverageModalProps } from "@/types/strategy";

function StrategyCountryCoverageModalFrame({
  country,
  projectSlug,
  onClose,
}: {
  country: string;
  projectSlug?: string | null;
  onClose: () => void;
}) {
  const { coverage, showAlphaaPlatforms, loading, error, load, reset } =
    useCountryCoverage();

  useEffect(() => {
    void load(country, projectSlug);
    return () => reset();
  }, [country, projectSlug, load, reset]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const row = coverage?.rows[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close country coverage dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="strategy-country-coverage-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 flex w-full max-w-[1200px] flex-col gap-4 rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CountryFlag country={country} className="h-5 w-7" />
              <h2
                id="strategy-country-coverage-title"
                className="truncate text-[20px] font-extrabold text-[var(--color-ink)]"
              >
                {country}
              </h2>
            </div>
            <p className="mt-1 text-[13px] text-[var(--color-muted)]">
              Strategy-style live coverage. Platforms and holders below target are
              highlighted in red.
            </p>
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label="Close country coverage dialog"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {loading ? (
          <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[13px] text-[var(--color-muted)]">
            Loading live coverage…
          </p>
        ) : error ? (
          <p
            role="alert"
            className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[13px] font-medium text-[var(--color-coral)]"
          >
            {error}
          </p>
        ) : row ? (
          <AdminCountryCoverageDetail
            row={row}
            showAlphaaPlatforms={showAlphaaPlatforms}
          />
        ) : (
          <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[13px] text-[var(--color-muted)]">
            No live coverage found for {country}.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function StrategyCountryCoverageModal({
  country,
  open,
  onClose,
  projectSlug,
}: StrategyCountryCoverageModalProps) {
  return (
    <AnimatePresence>
      {open && country ? (
        <StrategyCountryCoverageModalFrame
          key={`${projectSlug ?? "all"}:${country}`}
          country={country}
          projectSlug={projectSlug}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}
