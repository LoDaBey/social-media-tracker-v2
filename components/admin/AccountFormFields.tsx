"use client";

import { SETUP_CATEGORIES } from "@/lib/setup-options";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/platform-config";
import { platformUrlPlaceholder } from "@/lib/setup-schema";
import { SetupSelect } from "@/components/setup/SetupSelect";
import { SetupTextField } from "@/components/setup/SetupTextField";
import { AccountHolderSelect } from "@/components/admin/AccountHolderSelect";
import type { AccountFormFieldsProps } from "@/types/admin";

const fieldClass =
  "rounded outline-none border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50";

export function AccountFormFields({
  value,
  fieldErrors,
  platformLocked = false,
  holderOptions,
  onChange,
}: AccountFormFieldsProps) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
        Platform
        <select
          value={value.platform}
          disabled={platformLocked}
          aria-label="Account platform"
          aria-invalid={Boolean(fieldErrors.platform)}
          onChange={(e) =>
            onChange({
              platform: e.target.value as AccountFormFieldsProps["value"]["platform"],
            })
          }
          className={`cursor-pointer ${fieldClass}`}
        >
          {PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]">
        Status
        <select
          value={value.status ?? "active"}
          aria-label="Account status"
          onChange={(e) =>
            onChange({
              status: e.target
                .value as NonNullable<AccountFormFieldsProps["value"]["status"]>,
            })
          }
          className={`cursor-pointer ${fieldClass}`}
        >
          <option value="active">Active</option>
          <option value="archived">Temp locked</option>
          <option value="suspended">Suspended</option>
        </select>
      </label>
      {holderOptions && holderOptions.length > 0 ? (
        <AccountHolderSelect
          value={value}
          options={holderOptions}
          error={fieldErrors.accountHolder}
          onChange={onChange}
        />
      ) : (
        <SetupTextField
          label="Account holder"
          value={value.accountHolder}
          ariaLabel="Account holder"
          error={fieldErrors.accountHolder}
          ariaInvalid={Boolean(fieldErrors.accountHolder)}
          onChange={(accountHolder) => onChange({ accountHolder })}
        />
      )}
      <SetupTextField
        label="Username"
        value={value.username}
        ariaLabel="Account username"
        error={fieldErrors.username}
        ariaInvalid={Boolean(fieldErrors.username)}
        onChange={(username) => onChange({ username })}
      />
      <SetupTextField
        label="Profile URL"
        value={value.url}
        placeholder={platformUrlPlaceholder(value.platform)}
        ariaLabel="Account URL"
        error={fieldErrors.url}
        ariaInvalid={Boolean(fieldErrors.url)}
        onChange={(url) => onChange({ url })}
      />
      <SetupSelect
        id="account-category"
        label="Category"
        value={value.category}
        options={SETUP_CATEGORIES}
        placeholder="Select a category"
        ariaLabel="Account category"
        ariaInvalid={Boolean(fieldErrors.category)}
        error={fieldErrors.category}
        onChange={(category) => onChange({ category })}
      />
      <SetupTextField
        label="Email"
        type="email"
        value={value.email}
        ariaLabel="Account email"
        error={fieldErrors.email}
        ariaInvalid={Boolean(fieldErrors.email)}
        onChange={(email) => onChange({ email })}
      />
      <SetupTextField
        label="Mobile number"
        type="tel"
        value={value.mobileNumber}
        ariaLabel="Account mobile number"
        error={fieldErrors.mobileNumber}
        ariaInvalid={Boolean(fieldErrors.mobileNumber)}
        onChange={(mobileNumber) => onChange({ mobileNumber })}
      />
      <SetupTextField
        label="Account password"
        value={value.accountPassword}
        ariaLabel="Account password"
        autoComplete="off"
        error={fieldErrors.accountPassword}
        ariaInvalid={Boolean(fieldErrors.accountPassword)}
        onChange={(accountPassword) => onChange({ accountPassword })}
      />
      <SetupTextField
        label="Email password"
        value={value.emailPassword}
        ariaLabel="Email password"
        autoComplete="off"
        error={fieldErrors.emailPassword}
        ariaInvalid={Boolean(fieldErrors.emailPassword)}
        onChange={(emailPassword) => onChange({ emailPassword })}
      />
    </div>
  );
}
