"use client";

import { StrategyTargetsGrid } from "./StrategyTargetsGrid";
import type { StrategyHandlerEditorProps } from "@/types/strategy";

export function StrategyHandlerEditor({
  value,
  onChange,
}: StrategyHandlerEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-semibold text-[var(--color-ink)]">
        Per-handler template
      </p>
      <p className="text-[12px] text-[var(--color-muted)]">
        Expected accounts for each handler. Example: Sudan TikTok personal = 2.
      </p>
      <StrategyTargetsGrid
        label="Handler template"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
