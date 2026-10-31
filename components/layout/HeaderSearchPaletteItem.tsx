"use client";

import { HeaderSearchPaletteItemIcon } from "@/components/layout/HeaderSearchPaletteItemIcon";
import type { HeaderSearchPaletteItemProps } from "@/types/layout";

export function HeaderSearchPaletteItem({
  item,
  selected,
  onHover,
  onSelect,
}: HeaderSearchPaletteItemProps) {
  return (
    <button
      type="button"
      id={item.id}
      role="option"
      aria-selected={selected}
      aria-label={`${item.title}${item.subtitle ? `, ${item.subtitle}` : ""}`}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none ${
        selected
          ? "bg-[var(--color-emerald-tint)]"
          : "hover:bg-[var(--color-cream-tint)]"
      }`}
    >
      <HeaderSearchPaletteItemIcon
        id={item.id}
        kind={item.kind}
        title={item.title}
      />
      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-ink)]">
        {item.title}
      </span>
      {item.subtitle ? (
        <span className="max-w-[45%] shrink-0 truncate text-[12px] text-[var(--color-muted)]">
          {item.subtitle}
        </span>
      ) : null}
    </button>
  );
}
