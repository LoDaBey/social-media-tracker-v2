import type { ManagerSetupStatusBadgeProps } from "@/types/manager";

export function ManagerSetupStatusBadge({
  setupComplete,
  setupNeedsReview,
}: ManagerSetupStatusBadgeProps) {
  if (setupComplete) {
    return (
      <span className="inline-flex rounded-full bg-[var(--color-emerald-tint)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-emerald)]">
        Complete
      </span>
    );
  }
  if (setupNeedsReview) {
    return (
      <span className="inline-flex rounded-full bg-[#E08A2C]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#E08A2C]">
        Needs review
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-[var(--color-coral-tint)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-coral)]">
      Needs setup
    </span>
  );
}
