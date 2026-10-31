"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

export function HeaderSearchPaletteFooter() {
  const modifier =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform)
      ? "⌘"
      : "Ctrl";

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--color-hairline)] px-4 py-2.5 text-[11px] text-[var(--color-muted)]">
      <span className="inline-flex items-center gap-1">
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
        to move
      </span>
      <span>Enter to open</span>
      <span>{modifier} K to toggle</span>
    </p>
  );
}
