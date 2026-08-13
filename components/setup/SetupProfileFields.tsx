"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import {
  SETUP_COUNTRIES,
  SETUP_LANGUAGES,
  SETUP_REGION,
} from "@/lib/setup-options";
import { setupCardVariants } from "@/lib/setup-motion";
import { SetupSelect } from "@/components/setup/SetupSelect";
import type { SetupProfileFieldsProps } from "@/types/setup";

export function SetupProfileFields({
  country,
  language,
  fieldErrors = {},
  onChange,
}: SetupProfileFieldsProps) {
  return (
    <motion.section
      className="min-w-0 w-full max-w-full overflow-x-hidden bg-[var(--color-surface)] border border-[var(--color-hairline)] p-4 sm:p-6 md:p-7"
      style={{
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
      }}
      aria-label="Work profile"
      variants={setupCardVariants}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
          style={{ width: 44, height: 44, borderRadius: 14 }}
          aria-hidden="true"
        >
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <p
            className="text-[18px] font-bold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-cairo)", fontWeight: 700 }}
          >
            Work profile
          </p>
          <p
            className="text-[13px] text-[var(--color-muted)]"
            style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
          >
            Region is {SETUP_REGION} for every country. Choose country and language.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SetupSelect
          id="setup-country"
          label="Country"
          value={country}
          options={SETUP_COUNTRIES}
          placeholder="Select a country"
          ariaLabel="Country"
          ariaInvalid={Boolean(fieldErrors.country)}
          error={fieldErrors.country}
          onChange={(value) => onChange({ country: value })}
        />
        <SetupSelect
          id="setup-language"
          label="Language"
          value={language}
          options={SETUP_LANGUAGES}
          placeholder="Select a language"
          ariaLabel="Language"
          ariaInvalid={Boolean(fieldErrors.language)}
          error={fieldErrors.language}
          onChange={(value) => onChange({ language: value })}
        />
      </div>
    </motion.section>
  );
}
