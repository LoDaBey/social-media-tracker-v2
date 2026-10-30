"use client";

import {
  AFRICA_EUROPE_HANDLER_FIELDS,
  STRATEGY_SCOPE_LABELS,
  strategyDisplayScopesForBook,
  targetsGrandTotal,
} from "@/lib/strategy-platforms";
import { StrategyHandlerFields } from "./StrategyHandlerFields";
import { StrategyPlatformGrid } from "./StrategyPlatformGrid";
import type { StrategyAccountScope, StrategyHandlerEditorProps } from "@/types/strategy";

const SCOPE_DOT: Record<StrategyAccountScope, string> = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
};

export function StrategyHandlerEditor({
  book,
  value,
  onChange,
  platforms,
  description = "How many seats each resource on this country holds.",
  readOnly = false,
}: StrategyHandlerEditorProps) {
  const total = targetsGrandTotal(value);
  const scopes = strategyDisplayScopesForBook(book);

  return (
    <section
      aria-label="Per-handler template"
      className="flex min-w-0 flex-col gap-3 rounded-[16px] bg-[var(--color-cream-tint)] p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
            Per-handler template
          </h3>
          <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          <p className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
            {total}
          </p>
        </div>
      </div>

      {book === "africa_europe" ? (
        <StrategyHandlerFields
          value={value}
          onChange={onChange}
          fields={AFRICA_EUROPE_HANDLER_FIELDS}
          readOnly={readOnly}
        />
      ) : (
        <StrategyPlatformGrid
          book={book}
          value={value}
          onChange={onChange}
          platforms={platforms}
          showHeader={false}
          embedded
          readOnly={readOnly}
          label="Handler seats by platform"
        />
      )}
    </section>
  );
}
