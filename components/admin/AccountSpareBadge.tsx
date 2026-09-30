import type { AccountSpareBadgeProps } from "@/types/admin";

export function AccountSpareBadge({ isSpare }: AccountSpareBadgeProps) {
  if (!isSpare) return null;
  return (
    <span className="inline-flex rounded-lg bg-[var(--color-gold)]/20 px-2 py-0.5 text-[12px] font-semibold text-[var(--color-ink)]">
      Spare
    </span>
  );
}
