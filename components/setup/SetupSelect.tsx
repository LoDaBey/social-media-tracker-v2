"use client";

import type { SetupSelectProps } from "@/types/setup";

export function SetupSelect({
  id,
  label,
  value,
  options,
  placeholder,
  ariaLabel,
  ariaInvalid,
  error,
  onChange,
}: SetupSelectProps) {
  const invalid = Boolean(ariaInvalid || error);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-cairo)" }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        aria-describedby={errorId}
        onChange={(e) => onChange(e.target.value)}
        data-setup-field=""
        className={[
          "box-border w-full min-w-0 max-w-full scroll-mb-28 scroll-mt-6 cursor-pointer rounded outline-none border bg-white px-3 py-2 text-[14px] text-[var(--color-ink)]",
          invalid
            ? "border-[var(--color-coral)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
            : "border-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        ].join(" ")}
        style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? (
        <p
          id={errorId}
          className="text-[12px] font-semibold text-[var(--color-coral)]"
          style={{ fontFamily: "var(--font-cairo)" }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
