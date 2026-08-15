import type { AccountCategoryBadgeProps } from "@/types/admin";

export function AccountCategoryBadge({ category }: AccountCategoryBadgeProps) {
  if (category === "GH-G") {
    return (
      <span className="inline-flex rounded-lg bg-[var(--color-emerald)] px-2 py-0.5 text-[12px] font-semibold text-white">
        GH-G
      </span>
    );
  }
  if (category === "GH-R") {
    return (
      <span className="inline-flex rounded-lg bg-[var(--color-coral)] px-2 py-0.5 text-[12px] font-semibold text-white">
        GH-R
      </span>
    );
  }
  return (
    <span className="text-[13px] text-[var(--color-muted)]">{category || "—"}</span>
  );
}
