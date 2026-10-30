import {
  handlerFieldValue,
  setHandlerFieldValue,
  STRATEGY_PLATFORM_SHORT_LABELS,
  STRATEGY_SCOPE_LABELS,
} from "@/lib/strategy-platforms";
import { StrategyPlatformIcon } from "./StrategyPlatformIcon";
import type {
  StrategyAccountScope,
  StrategyHandlerSeatCardProps,
} from "@/types/strategy";

const SCOPE_BAR: Record<StrategyAccountScope, string> = {
  personal: "bg-[var(--color-emerald)]",
  umbrella: "bg-[#4A8EC7]",
  native: "bg-[var(--color-gold)]",
};

const inputClass =
  "h-8 w-14 shrink-0 cursor-text rounded-lg outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-1 text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export function StrategyHandlerSeatCard({
  platform,
  fields,
  value,
  onChange,
  readOnly = false,
}: StrategyHandlerSeatCardProps) {
  const title = STRATEGY_PLATFORM_SHORT_LABELS[platform];
  const counts = fields.map((field) => handlerFieldValue(value, field));
  const total = counts.reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...counts, 1);
  const splitScopes = fields.some((field) => field.scope !== "all");

  return (
    <article className="relative flex flex-col gap-2.5 rounded-[14px] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-hairline)]">
      <header className="flex items-center gap-2">
        <StrategyPlatformIcon platform={platform} className="h-6 w-6" />
        <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-ink)]">
          {title}
        </h4>
        {splitScopes ? (
          <p className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
            {total}
          </p>
        ) : readOnly ? (
          <span className="w-14 text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
            {total}
          </span>
        ) : (
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            aria-label={fields[0]?.label ?? title}
            className={inputClass}
            value={total}
            onChange={(event) => {
              const field = fields[0];
              if (!field) return;
              onChange(
                setHandlerFieldValue(value, field, Number(event.target.value))
              );
            }}
          />
        )}
      </header>

      {splitScopes ? (
        <ul className="flex flex-col gap-2">
          {fields.map((field, index) => {
            const count = counts[index] ?? 0;
            const width = count <= 0 ? 0 : Math.max(10, (count / maxCount) * 100);
            const scope =
              field.scope === "all" ? null : (field.scope as StrategyAccountScope);
            const barClass = scope ? SCOPE_BAR[scope] : "bg-[var(--color-emerald)]";

            return (
              <li key={field.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--color-muted)]">
                    {scope ? STRATEGY_SCOPE_LABELS[scope] : field.label}
                  </span>
                  {readOnly ? (
                    <span className="w-14 text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
                      {count}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      aria-label={field.label}
                      className={inputClass}
                      value={count}
                      onChange={(event) =>
                        onChange(
                          setHandlerFieldValue(
                            value,
                            field,
                            Number(event.target.value)
                          )
                        )
                      }
                    />
                  )}
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-[var(--color-cream)]"
                  aria-hidden="true"
                >
                  <div
                    className={`h-1.5 rounded-full ${barClass}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-[var(--color-cream)]"
          aria-hidden="true"
        >
          <div
            className="h-1.5 rounded-full bg-[var(--color-emerald)]"
            style={{ width: total <= 0 ? "0%" : "100%" }}
          />
        </div>
      )}
    </article>
  );
}
