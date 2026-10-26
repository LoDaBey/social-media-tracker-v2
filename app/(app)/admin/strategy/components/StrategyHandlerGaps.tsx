import { strategyNeedsSentence } from "@/lib/strategy-platforms";
import type { StrategyHandlerGapsProps } from "@/types/strategy";

export function StrategyHandlerGaps({ handlers }: StrategyHandlerGapsProps) {
  const people = handlers.filter((handler) => !handler.vacant);
  const vacantCount = handlers.filter((handler) => handler.vacant).length;

  if (people.length === 0 && vacantCount === 0) {
    return (
      <p className="text-[13px] text-[var(--color-muted)]">
        Every person already has their mix.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Each person still needs
      </p>
      <ul className="flex flex-col gap-2">
        {people.map((handler) => (
          <li
            key={handler.id ?? handler.fullName}
            className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2"
          >
            <p className="text-[13px] font-semibold text-[var(--color-ink)]">
              {handler.fullName}
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-coral)]">
              {strategyNeedsSentence(handler.lines)}
            </p>
          </li>
        ))}
        {vacantCount > 0 ? (
          <li className="rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2">
            <p className="text-[13px] font-semibold text-[var(--color-ink)]">
              Empty seat{vacantCount === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-coral)]">
              Need {vacantCount} more {vacantCount === 1 ? "person" : "people"}
            </p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
