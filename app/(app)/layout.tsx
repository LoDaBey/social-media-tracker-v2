import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import type { Role } from "@/types/db";
import { ROLE_LABELS } from "@/lib/role-hierarchy";
import { DateBadge } from "@/components/dashboard/DateBadge";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { UserMenuSettingsLink } from "@/components/layout/UserMenuSettingsLink";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

function roleBadgeLabel(role: Role) {
  if (role === "team_lead") return `QC · ${ROLE_LABELS.team_lead}`;
  if (role === "admin") return ROLE_LABELS.admin;
  if (role === "manager") return ROLE_LABELS.manager;
  if (role === "op") return ROLE_LABELS.op;
  return null;
}

function avatarRingColor(role: Role) {
  if (role === "admin") return "var(--color-gold)";
  if (role === "team_lead") return "var(--color-emerald)";
  if (role === "manager") return "var(--color-emerald)";
  return "var(--color-hairline)";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const name = session.user?.name ?? "User";
  const email = session.user?.email ?? "";
  const role = (session.user?.role ?? "employee") as Role;
  const roleLabel = roleBadgeLabel(role);
  const initial = (name.trim()[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-dvh bg-[var(--color-cream)]">
      <header className="relative isolate z-50 h-16 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <div
          className={[
            "mx-auto flex h-full w-full items-center justify-between px-4 sm:px-8",
            role === "admin" || role === "manager"
              ? "max-w-[1600px]"
              : "max-w-7xl",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Orbit home"
              className="inline-flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              <BrandLogo size="header" priority />
            </Link>
            {role === "admin" ? (
              <div className="hidden min-w-0 items-center gap-3 lg:flex">
                <DateBadge />
              </div>
            ) : (
              <DateBadge />
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {roleLabel ? (
              <span className="rounded-full bg-[var(--color-emerald)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                {roleLabel}
              </span>
            ) : null}

            <ThemeToggle />

            <NotificationBell />

            <details className="relative">
              <summary
                aria-label="Open user menu"
                className="cursor-pointer rounded-lg list-none flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              >
                <div
                  className="h-10 w-10 rounded-full bg-[var(--color-emerald-tint)] flex items-center justify-center text-[14px] font-bold text-[var(--color-ink)]"
                  style={{
                    boxShadow: `0 0 0 2px ${avatarRingColor(role)}`,
                  }}
                  aria-label="User avatar"
                >
                  {initial}
                </div>
                <ChevronDown
                  className="h-4 w-4 text-[var(--color-muted)]"
                  aria-hidden="true"
                />
              </summary>

              <div
                className="absolute z-[60] mt-2 w-[260px] rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-hairline)] p-2"
                style={{ insetInlineEnd: 0, boxShadow: "0 12px 32px rgba(20,20,20,.08)" }}
              >
                <div className="px-3 py-2 text-[13px] text-[var(--color-muted)]">
                  {email}
                </div>
                <div className="my-1 h-px bg-[var(--color-hairline)]" />
                <UserMenuSettingsLink />
                <SignOutButton />
              </div>
            </details>
          </div>
        </div>
      </header>

      <div
        className={[
          "relative z-0 mx-auto w-full px-3 sm:px-8",
          role === "admin" || role === "manager"
            ? "max-w-[1600px]"
            : "max-w-7xl",
          role === "admin" ? "py-4 sm:py-6" : "py-8",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

