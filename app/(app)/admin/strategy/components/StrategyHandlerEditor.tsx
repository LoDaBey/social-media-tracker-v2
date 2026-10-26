"use client";

import { strategySheetGroupsForBook } from "@/lib/strategy-platforms";
import { StrategySheetEditor } from "./StrategySheetEditor";
import type { StrategyHandlerEditorProps } from "@/types/strategy";

export function StrategyHandlerEditor({
  book,
  value,
  onChange,
}: StrategyHandlerEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Per-handler template
      </p>      <StrategySheetEditor
        label="Handler template"
        value={value}
        onChange={onChange}
        groups={strategySheetGroupsForBook(book)}
      />
    </div>
  );
}
