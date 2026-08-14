"use client";

import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import type { SignOutOverlayProps } from "@/types/layout";

export function SignOutOverlay({ visible }: SignOutOverlayProps) {
  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      role="status"
      aria-live="polite"
      aria-label="Signing out"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-5 py-4 shadow-[0_12px_32px_rgba(20,20,20,.12)]">
        <Loader2
          className="h-5 w-5 animate-spin text-[var(--color-emerald)]"
          aria-hidden="true"
        />
        <p className="text-[14px] font-semibold text-[var(--color-ink)]">
          Signing out…
        </p>
      </div>
    </div>,
    document.body
  );
}
