import {
  fetchAdminSpareAccounts,
  fetchAdminSpareMarkHolders,
} from "@/lib/admin-accounts-data";
import {
  getAdminViewerOrNull,
  readableAdminNavPages,
  viewerAllows,
} from "@/lib/admin-access";
import { fetchAdminCommandPalettePeople } from "@/lib/admin-data";
import { AdminHeaderNav } from "@/components/layout/AdminHeaderNav";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { HeaderUserMenu } from "@/components/layout/HeaderUserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { isAdminWorkspaceRole } from "@/lib/role-hierarchy";
import type { AppHeaderProps } from "@/types/layout";
import type { AdminPermissionPageKey } from "@/types/permissions";
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
  const isAdminWorkspace = isAdminWorkspaceRole(role);
  const initials = headerInitials(name);
  const viewer = isAdminWorkspace ? await getAdminViewerOrNull() : null;
  let [spareAccounts, spareHolders, people] = isAdminWorkspace
    ? await Promise.all([
        fetchAdminSpareAccounts(),
        fetchAdminSpareMarkHolders(),
        fetchAdminCommandPalettePeople(),
      ])
    : [[], [], []];

  if (viewer?.role === "op" && viewer.scope) {
    const allowed = new Set(viewer.scope.countries);
    const regionName = viewer.scope.region.toLowerCase();
    const inScopeCountry = (country: string | null | undefined) => {
      if (!country) return false;
      const base = baseCountryFromDisplay(country);
      return allowed.has(base) || allowed.has(country);
    };
    spareAccounts = spareAccounts.filter((account) =>
      inScopeCountry(account.country)
    );
    spareHolders = spareHolders.filter(
      (holder) =>
        inScopeCountry(holder.country) &&
        (holder.region ?? "").trim().toLowerCase() === regionName
    );
    people = people.filter((person) => inScopeCountry(person.country));
  }

  const canReadSpare = viewer ? viewerAllows(viewer, "spare", "canRead") : false;
  if (!canReadSpare) {
    spareAccounts = [];
    spareHolders = [];
  }

  const allowedPages: AdminPermissionPageKey[] = viewer
    ? [
        ...readableAdminNavPages(viewer).map((item) => item.pageKey),
        ...(canReadSpare ? (["spare"] as const) : []),
      ]
    : [];

  return (
    <header className="relative isolate z-50 h-16 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
      <div
        className={[
          "mx-auto flex h-full w-full items-center justify-between gap-3 px-4 sm:px-8",
          isAdminWorkspace || role === "manager"
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
          {isAdminWorkspace ? (
            <AdminHeaderNav
              spareCount={spareAccounts.length}
              spareAccounts={spareAccounts}
              spareHolders={spareHolders}
              allowedPages={allowedPages}
            />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAdminWorkspace ? (
            <HeaderSearch people={people} />
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
