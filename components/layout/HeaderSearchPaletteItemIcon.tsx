"use client";

import {
  Activity,
  Bookmark,
  FileSpreadsheet,
  LayoutDashboard,
  Map,
  Plus,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import type { HeaderSearchPaletteItemIconProps } from "@/types/layout";

export function HeaderSearchPaletteItemIcon({
  id,
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

  if (kind === "account") {
    return <Share2 className={className} aria-hidden="true" />;
  }

  if (id === "action:new-employee") {
    return <Plus className={className} aria-hidden="true" />;
  }
  if (id === "action:spare") {
    return <Bookmark className={className} aria-hidden="true" />;
  }
  if (id === "page:overview") {
    return <LayoutDashboard className={className} aria-hidden="true" />;
  }
  if (id === "page:employees") {
    return <Users className={className} aria-hidden="true" />;
  }
  if (id === "page:strategy") {
    return <Map className={className} aria-hidden="true" />;
  }
  if (id === "page:activity") {
    return <Activity className={className} aria-hidden="true" />;
  }
  if (id === "page:extract") {
    return <FileSpreadsheet className={className} aria-hidden="true" />;
  }
  if (id === "page:settings") {
    return <Settings className={className} aria-hidden="true" />;
  }

  return <LayoutDashboard className={className} aria-hidden="true" />;
}
