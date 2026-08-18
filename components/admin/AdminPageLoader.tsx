import { Loader2 } from "lucide-react";
import type { AdminPageLoaderProps } from "@/types/admin";

export function AdminPageLoader({
  label = "Loading overview",
}: AdminPageLoaderProps) {
  return (
    <div
      className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className="h-8 w-8 animate-spin text-[var(--color-emerald)]"
        aria-hidden="true"
      />
      <p className="text-[14px] font-semibold text-[var(--color-muted)]">
        {label}…
      </p>
    </div>
  );
}
