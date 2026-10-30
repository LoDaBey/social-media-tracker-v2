"use client";

import {
  AFRICA_EUROPE_HANDLER_FIELDS,
  strategySheetGroupsForBook,
} from "@/lib/strategy-platforms";
import { StrategyHandlerFields } from "./StrategyHandlerFields";
import { StrategySheetEditor } from "./StrategySheetEditor";
import type { StrategyHandlerEditorProps } from "@/types/strategy";

export function StrategyHandlerEditor({
  book,
  value,
  onChange,
}: StrategyHandlerEditorProps) {
  return (
    <details className="rounded-[14px] bg-[var(--color-cream-tint)] px-4 py-3" open>
      <summary className="cursor-pointer list-none text-[13px] font-semibold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]">
        Per-handler template
        <span className="ml-2 font-normal text-[var(--color-muted)]">
          Seat counts copied onto each resource
        </span>
      </summary>
      <div className="mt-3">
        {book === "africa_europe" ? (
          <StrategyHandlerFields
            value={value}
            onChange={onChange}
            fields={AFRICA_EUROPE_HANDLER_FIELDS}
          />
        ) : (
          <StrategySheetEditor
            label="Handler template"
            value={value}
            onChange={onChange}
            groups={strategySheetGroupsForBook(book)}
          />
        )}
      </div>
    </details>
  );
}
