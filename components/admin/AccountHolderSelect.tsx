"use client";

import type { AccountHolderSelectProps } from "@/types/admin";

export function AccountHolderSelect({
  value,
  options,
  error,
  onChange,
}: AccountHolderSelectProps) {
  const selectedId =
    value.holderUserId != null
      ? String(value.holderUserId)
      : String(
          options.find((option) => option.full_name === value.accountHolder)
            ?.id ?? ""
        );

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor="account-holder"
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
      >
        Account holder
      </label>
      <select
        id="account-holder"
        value={selectedId}
        aria-label="Account holder"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "account-holder-error" : undefined}
        onChange={(event) => {
          const id = Number(event.target.value);
          const option = options.find((item) => item.id === id);
          if (!option) return;
          onChange({
            holderUserId: option.id,
            accountHolder: option.full_name,
          });
        }}
        className={`cursor-pointer rounded outline-none border px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] ${
          error
            ? "border-[var(--color-coral)] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
            : "border-[var(--color-hairline)] bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        }`}
      >
        <option value="" disabled>
          Select an account holder
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.full_name} — {option.country}
          </option>
        ))}
      </select>
      {error ? (
        <p
          id="account-holder-error"
          className="text-[12px] font-semibold text-[var(--color-coral)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
