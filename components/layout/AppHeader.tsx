import {
  fetchAdminSpareAccounts,
  fetchAdminSpareMarkHolders,
} from "@/lib/admin-accounts-data";
import { fetchAdminCommandPalettePeople } from "@/lib/admin-data";
import { AdminHeaderNav } from "@/components/layout/AdminHeaderNav";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderUserMenu } from "@/components/layout/HeaderUserMenu";
import { DateBadge } from "@/components/dashboard/DateBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { AppHeaderProps } from "@/types/layout";
import Link from "next/link";

function headerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || "U").toUpperCase();
}

export async function AppHeader({
  name,
  email,
  role,
  roleLabel,
}: AppHeaderProps) {
  const isAdmin = role === "admin";
  const initials = headerInitials(name);
  const [spareAccounts, spareHolders, people] = isAdmin
    ? await Promise.all([
        fetchAdminSpareAccounts(),
        fetchAdminSpareMarkHolders(),
        fetchAdminCommandPalettePeople(),
      ])
    : [[], [], []];

  return (
    <header className="relative isolate z-50 h-16 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <div
        className={[
          "mx-auto flex h-full w-full items-center justify-between gap-3 px-4 sm:px-8",
          role === "admin" || role === "manager"
            ? "max-w-[1600px]"
            : "max-w-7xl",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/"
            aria-label="Orbit home"
            className="inline-flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <BrandLogo size="header" priority />
          </Link>
          {isAdmin ? (
            <AdminHeaderNav
              spareCount={spareAccounts.length}
              spareAccounts={spareAccounts}
              spareHolders={spareHolders}
            />
          ) : (
            <DateBadge />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAdmin ? (
            <>
              <DateBadge variant="plain" />
              <HeaderSearch people={people} />
            </>
          ) : roleLabel ? (
            <span className="rounded-full bg-[var(--color-emerald)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
              {roleLabel}
            </span>
          ) : null}

          <ThemeToggle />
          <NotificationBell />
          <HeaderUserMenu
            name={name}
            email={email}
            role={role}
            initials={initials}
          />
        </div>
      </div>
    </header>
  );
}
