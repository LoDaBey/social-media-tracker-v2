"use client";

import { ChevronDown } from "lucide-react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { UserMenuSettingsLink } from "@/components/layout/UserMenuSettingsLink";
import type { HeaderUserMenuProps } from "@/types/layout";

function avatarRingColor(role: HeaderUserMenuProps["role"]) {
  if (role === "admin") return "var(--color-gold)";
  if (role === "team_lead") return "var(--color-emerald)";
  if (role === "manager") return "var(--color-emerald)";
  return "var(--color-hairline)";
}

export function HeaderUserMenu({
  name,
  email,
  role,
  initials,
}: HeaderUserMenuProps) {
  const showName = role === "admin";

  return (
    <details className="relative">
      <summary
        aria-label="Open user menu"
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[13px] font-bold text-[var(--color-ink)]"
          style={{
            boxShadow: `0 0 0 2px ${avatarRingColor(role)}`,
          }}
          aria-label={`${name} avatar`}
        >
          {initials}
        </div>
        {showName ? (
          <span className="hidden text-[13px] font-semibold text-[var(--color-ink)] sm:inline">
            Admin
          </span>
        ) : null}
        <ChevronDown
          className="h-4 w-4 text-[var(--color-muted)]"
          aria-hidden="true"
        />
      </summary>

      <div
        className="absolute z-[60] mt-2 w-[260px] rounded-[var(--radius-card)] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-2"
        style={{
          insetInlineEnd: 0,
          boxShadow: "0 12px 32px rgba(20,20,20,.08)",
        }}
      >
        <div className="px-3 py-2 text-[13px] text-[var(--color-muted)]">
          {email}
        </div>
        <div className="my-1 h-px bg-[var(--color-hairline)]" />
        <UserMenuSettingsLink />
        <SignOutButton />
      </div>
    </details>
  );
}
