import {
  STRATEGY_SCOPE_LABELS,
  strategyDisplayScopesForBook,
  strategyGridPlatformsForBook,
} from "@/lib/strategy-platforms";
import { StrategyPlatformCard } from "./StrategyPlatformCard";
import type { StrategyAccountScope, StrategyPlatformGridProps } from "@/types/strategy";

const SCOPE_DOT: Record<StrategyAccountScope, string> = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
};

export function StrategyPlatformGrid({
  book,
  value,
  onChange,
  missingByPlatform,
  highlightedPlatform,
  highlightToken,
}: StrategyPlatformGridProps) {
  const platforms = strategyGridPlatformsForBook(book);
  const scopes = strategyDisplayScopesForBook(book);

  return (
    <section
      aria-label="Platforms by category"
      className="flex min-w-0 flex-col gap-3 rounded-[16px] bg-[var(--color-cream-tint)] p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
            Platforms (accounts by category)
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
            Type a number on each card, then Save country.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-3" aria-label="Category legend">
          {scopes.map((scope) => (
            <li
              key={scope}
              className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]"
            >
              <span className={`h-2 w-2 rounded-sm ${SCOPE_DOT[scope]}`} aria-hidden="true" />
              {STRATEGY_SCOPE_LABELS[scope]}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {platforms.map((platform) => (
          <StrategyPlatformCard
            key={platform}
            platform={platform}
            book={book}
            value={value}
            onChange={onChange}
            missing={missingByPlatform[platform] ?? 0}
            highlighted={highlightedPlatform === platform}
            highlightToken={highlightToken}
          />
        ))}
      </div>
    </section>
  );
}
