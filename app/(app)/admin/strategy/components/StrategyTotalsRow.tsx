import { Building2, Umbrella, User } from "lucide-react";
import type { StrategyTotalsKind, StrategyTotalsRowProps } from "@/types/strategy";

const ROW: Record<
  StrategyTotalsKind,
  {
    label: string;
    icon: typeof User;
    iconClass: string;
  }
> = {
  personal: {
    label: "Personal",
    icon: User,
    iconClass:
      "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
  },
  umbrella: {
    label: "Umbrella",
    icon: Umbrella,
    iconClass: "bg-[#4A8EC7]/15 text-[#4A8EC7]",
  },
  native: {
    label: "Native",
    icon: Building2,
    iconClass: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
  },
};

export function StrategyTotalsRow({ kind, value }: StrategyTotalsRowProps) {
  const row = ROW[kind];
  const Icon = row.icon;

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${row.iconClass}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <p className="min-w-0 flex-1 text-[13px] font-medium text-[var(--color-ink)]">
        {row.label}
      </p>
      <p className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}
