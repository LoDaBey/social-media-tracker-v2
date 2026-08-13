"use client";

import type { SetupTextFieldProps } from "@/types/setup";

export function SetupTextField({
  label,
  value,
  placeholder,
  ariaLabel,
  ariaInvalid,
  error,
  describedBy,
  type = "text",
  inputMode,
  autoComplete,
  disabled = false,
  onChange,
  onBlur,
}: SetupTextFieldProps) {
  const invalid = Boolean(ariaInvalid || error);
  const errorId = error ? `${ariaLabel.replace(/\s+/g, "-").toLowerCase()}-error` : undefined;
  const describedByIds = [describedBy, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]"
        style={{ fontFamily: "var(--font-cairo)" }}
      >
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        onChange={(e) => {
          if (disabled) return;
          onChange(e.target.value);
        }}
        onBlur={onBlur}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        aria-describedby={describedByIds}
        data-setup-field=""
        className={[
          "box-border w-full min-w-0 max-w-full scroll-mb-28 scroll-mt-6 rounded outline-none border px-3 py-2 text-[14px] text-[var(--color-ink)]",
          disabled
            ? "cursor-not-allowed border-[var(--color-hairline)] bg-[var(--color-cream-tint)] text-[var(--color-muted)]"
            : invalid
              ? "border-[var(--color-coral)] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
              : "border-[var(--color-hairline)] bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        ].join(" ")}
        style={{ fontFamily: "var(--font-cairo)", fontWeight: 500 }}
      />
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
