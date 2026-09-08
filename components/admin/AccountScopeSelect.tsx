"use client";

import { accountScopeLabel, ACCOUNT_SCOPE_OPTIONS } from "@/lib/account-scope";
import type { AccountScope } from "@/types/db";

const fieldClass =
  "cursor-pointer rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

type AccountScopeSelectProps = {
  value: AccountScope;
  onChange: (scope: AccountScope) => void;
};

export function AccountScopeSelect({ value, onChange }: AccountScopeSelectProps) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
      Account type
      <select
        value={value}
        aria-label="Account type personal or umbrella"
        onChange={(e) => onChange(e.target.value as AccountScope)}
        className={fieldClass}
      >
        {ACCOUNT_SCOPE_OPTIONS.map((scope) => (
          <option key={scope} value={scope}>
            {accountScopeLabel(scope)}
          </option>
        ))}
      </select>
    </label>
  );
}
