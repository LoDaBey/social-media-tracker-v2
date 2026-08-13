import {
  ClipboardCheck,
  RefreshCw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { AdminKpiTileProps } from "@/types/admin";

const ICONS: Record<AdminKpiTileProps["icon"], LucideIcon> = {
  users: Users,
  clipboard: ClipboardCheck,
  wallet: Wallet,
  refresh: RefreshCw,
};

export function AdminKpiTile({ title, value, icon, subtitle }: AdminKpiTileProps) {
  const Icon = ICONS[icon];

  return (
    <div
      className="flex flex-col items-center gap-2 rounded-[16px] bg-[var(--color-surface)] px-3 py-4 text-center sm:px-4 sm:py-5"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      aria-label={`${title}: ${value}`}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <p className="text-[22px] font-extrabold tabular-nums leading-none text-[var(--color-ink)] sm:text-[26px]">
        {value}
      </p>
      <p className="text-[11px] font-medium leading-tight text-[var(--color-muted)] sm:text-[12px]">
        {title}
      </p>
      {subtitle ? (
        <p className="text-[11px] text-[var(--color-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
