import type { AccountStatusBadgeProps } from "@/types/admin";

export function AccountStatusBadge({ status }: AccountStatusBadgeProps) {
  if (status === "active") {
    return (
      <span className="inline-flex rounded-lg bg-[var(--color-emerald)] px-2 py-0.5 text-[12px] font-semibold text-white">
        Active
      </span>
    );
  }
  if (status === "archived") {
    return (
      <span className="inline-flex rounded-lg bg-[#E08A2C] px-2 py-0.5 text-[12px] font-semibold text-white">
        Temp locked
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-lg bg-[var(--color-coral)] px-2 py-0.5 text-[12px] font-semibold text-white">
      Suspended
    </span>
  );
}
