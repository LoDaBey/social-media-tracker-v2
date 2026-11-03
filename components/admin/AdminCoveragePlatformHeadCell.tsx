import { Building2, Umbrella, User } from "lucide-react";
import { StrategyPlatformIcon } from "@/app/(app)/admin/strategy/components/StrategyPlatformIcon";
import type {
  AdminCoveragePlatformHeadCellProps,
  AdminCoveragePlatformScopeIcon,
} from "@/types/admin";

const SCOPE_ICON: Record<
  AdminCoveragePlatformScopeIcon,
  { icon: typeof User; className: string; label: string }
> = {
  personal: {
    icon: User,
    className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    label: "Personal",
  },
  umbrella: {
    icon: Umbrella,
    className: "bg-[#4A8EC7]/15 text-[#4A8EC7]",
    label: "Umbrella",
  },
  native: {
    icon: Building2,
    className: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
    label: "Native",
  },
};

export function AdminCoveragePlatformHeadCell({
  platform,
  label,
  scopeIcon,
  className = "min-w-[5.75rem] px-4 py-3 align-bottom",
}: AdminCoveragePlatformHeadCellProps) {
  const scope = scopeIcon ? SCOPE_ICON[scopeIcon] : null;
  const ScopeIcon = scope?.icon;

  return (
    <th scope="col" className={className} title={label}>
      <span className="inline-flex items-center gap-1.5">
        <StrategyPlatformIcon platform={platform} className="h-6 w-6" />
        {scope && ScopeIcon ? (
          <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${scope.className}`}
            aria-hidden="true"
            title={scope.label}
          >
            <ScopeIcon className="h-3 w-3" strokeWidth={2.25} />
          </span>
        ) : null}
        <span className="sr-only">{label}</span>
      </span>
    </th>
  );
}
