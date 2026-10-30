"use client";

import {
  STRATEGY_PLATFORM_KEYS,
  STRATEGY_PLATFORM_SHORT_LABELS,
} from "@/lib/strategy-platforms";
import { StrategyPlatformIcon } from "./StrategyPlatformIcon";
import type { StrategyProjectPlatformPickerProps } from "@/types/strategy";

const chipActive =
  "border-[var(--color-emerald)] bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]";
const chipIdle =
  "border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-cream-tint)]";

export function StrategyProjectPlatformPicker({
  value,
  onChange,
  readOnly = false,
}: StrategyProjectPlatformPickerProps) {
  const platforms = readOnly
    ? STRATEGY_PLATFORM_KEYS.filter((platform) => value.includes(platform))
    : STRATEGY_PLATFORM_KEYS;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[12px] font-semibold text-[var(--color-muted)]">
        Platforms
      </legend>
      {platforms.length === 0 ? (
        <p className="text-[13px] text-[var(--color-muted)]">No platforms selected.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const active = value.includes(platform);
            const label = STRATEGY_PLATFORM_SHORT_LABELS[platform];
            if (readOnly) {
              return (
                <span
                  key={platform}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold ${chipActive}`}
                >
                  <StrategyPlatformIcon platform={platform} className="h-4 w-4" />
                  {label}
                </span>
              );
            }
            return (
              <button
                key={platform}
                type="button"
                aria-label={`Toggle ${label}`}
                aria-pressed={active}
                onClick={() =>
                  onChange(
                    active
                      ? value.filter((item) => item !== platform)
                      : [...value, platform]
                  )
                }
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                  active ? chipActive : chipIdle
                }`}
              >
                <StrategyPlatformIcon platform={platform} className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
