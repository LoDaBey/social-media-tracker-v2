"use client";

import { SETUP_LANGUAGES } from "@/lib/setup-options";
import type { StrategyLanguageSelectProps } from "@/types/strategy";

function languageOptions(value: string) {
  if (value && !(SETUP_LANGUAGES as readonly string[]).includes(value)) {
    return [value, ...SETUP_LANGUAGES];
  }
  return [...SETUP_LANGUAGES];
}

export function StrategyLanguageSelect({
  id,
  label,
  value,
  allowEmpty = false,
  emptyLabel = "Select a language",
  onChange,
}: StrategyLanguageSelectProps) {
  return (
    <label
      htmlFor={id}
      className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]"
    >
      {label}
      <select
        id={id}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 min-w-[148px] cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        {allowEmpty || !value ? (
          <option value="">{emptyLabel}</option>
        ) : null}
        {languageOptions(value).map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
