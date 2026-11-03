"use client";

import { Share2 } from "lucide-react";
import type { HeaderSearchPaletteItemIconProps } from "@/types/layout";

export function HeaderSearchPaletteItemIcon({
  kind,
  title,
}: HeaderSearchPaletteItemIconProps) {
  const className = "h-4 w-4 shrink-0 text-[var(--color-muted)]";

  if (kind === "person") {
    return (
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[11px] font-bold text-[var(--color-ink)]"
        aria-hidden="true"
      >
        {(title.trim()[0] ?? "?").toUpperCase()}
      </span>
    );
  }

  return <Share2 className={className} aria-hidden="true" />;
}
