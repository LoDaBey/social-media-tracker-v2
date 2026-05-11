import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import { signOutAction } from "@/actions/auth";
import type { Role } from "@/types/db";
import { DateBadge } from "@/components/dashboard/DateBadge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { fetchPendingCountForReviewer } from "@/lib/qc-data";

function roleBadgeLabel(role: Role) {
  if (role === "team_lead") return "QC · Team Lead";
  if (role === "admin") return "Admin";
  return null;
}

function avatarRingColor(role: Role) {
  if (role === "admin") return "var(--color-gold)";
  if (role === "team_lead") return "var(--color-emerald)";
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

  const reviewerId = Number(session.user?.id);
  const isReviewer = role === "team_lead" || role === "admin";
  const pendingQcCount =
    (role === "team_lead" || role === "admin") && Number.isFinite(reviewerId)
      ? await fetchPendingCountForReviewer(reviewerId, role)
      : 0;

  return (
    <div className="min-h-dvh bg-[var(--color-cream)]">
      <header className="h-16 bg-[var(--color-surface)] border-b border-[var(--color-hairline)]">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[14px] bg-[var(--color-emerald-tint)] flex items-center justify-center">
              <Sparkles
                className="h-[18px] w-[18px] text-[var(--color-emerald)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[16px] font-bold text-[var(--color-ink)]">
                ALPHAA
              </p>
              <DateBadge />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === "admin" ? (
              <Link
                href="/admin"
                aria-label="Open administration panel"
                className="group inline-flex cursor-pointer items-center rounded-lg px-2 py-1 text-[13px] font-semibold text-[var(--color-muted)] outline-none hover:text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              >
                <span className="bg-gradient-to-r from-[var(--color-emerald)] to-[var(--color-emerald)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 group-hover:bg-[length:100%_2px]">
                  Admin
                </span>
              </Link>
            ) : null}

            {isReviewer ? (
              <Link
                href="/qc"
                aria-label={
                  pendingQcCount > 0
                    ? `Open quality review queue, ${pendingQcCount} pending`
                    : "Open quality review queue"
                }
                className="group relative inline-flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-semibold text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              >
                <span className="bg-gradient-to-r from-[var(--color-emerald)] to-[var(--color-emerald)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-200 group-hover:bg-[length:100%_2px]">
                  QC
                </span>
                {pendingQcCount > 0 ? (
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-emerald)] px-1.5 text-[11px] font-semibold text-white tabular-nums"
                    aria-hidden="true"
                  >
                    {pendingQcCount}
                  </span>
                ) : null}
              </Link>
            ) : null}

            {roleLabel ? (
              <span className="rounded-full bg-[var(--color-emerald)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white">
                {roleLabel}
              </span>
            ) : null}

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
                className="absolute z-50 mt-2 w-[260px] rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-hairline)] p-2"
                style={{ insetInlineEnd: 0, boxShadow: "0 12px 32px rgba(20,20,20,.08)" }}
              >
                <div className="px-3 py-2 text-[13px] text-[var(--color-muted)]">
                  {email}
                </div>
                <div className="my-1 h-px bg-[var(--color-hairline)]" />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    aria-label="Sign out"
                    className="cursor-pointer rounded-lg w-full px-3 py-2 text-left text-[13px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-cream-tint)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

