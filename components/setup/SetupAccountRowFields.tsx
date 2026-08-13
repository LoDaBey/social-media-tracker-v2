"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { SETUP_CATEGORIES } from "@/lib/setup-options";
import { setupButtonMotion, setupRowVariants } from "@/lib/setup-motion";
import { platformUrlPlaceholder } from "@/lib/setup-validation";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { SetupSelect } from "@/components/setup/SetupSelect";
import { SetupTextField } from "@/components/setup/SetupTextField";
import type { SetupAccountRowFieldsProps } from "@/types/setup";

export function SetupAccountRowFields({
  platform,
  platformLabel,
  row,
  index,
  fieldErrors = {},
  canRemove,
  onChange,
  onRemove,
}: SetupAccountRowFieldsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasAnyError = Object.keys(fieldErrors).length > 0;
  const n = index + 1;
  const accountLabel =
    row.accountHolder.trim() || row.username.trim() || `account ${n}`;

  return (
    <>
      <motion.div
        layout
        className={[
          "flex min-w-0 w-full max-w-full flex-col gap-3 border transition-colors",
          hasAnyError
            ? "border-[var(--color-coral)] bg-[var(--color-coral-tint)]"
            : "border-transparent bg-[#FAF8F2]",
        ].join(" ")}
        style={{
          borderRadius: 14,
          padding: "14px 16px",
        }}
        variants={setupRowVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        data-setup-account-row=""
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="min-w-0 truncate text-[13px] font-bold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-cairo)" }}
          >
            Account {n}
          </p>
          <motion.button
            type="button"
            aria-label={`Remove ${platformLabel} account ${n}`}
            disabled={!canRemove}
            onClick={() => setConfirmOpen(true)}
            layout
            className={[
              "cursor-pointer rounded-lg",
              "h-9 w-9 shrink-0",
              "flex items-center justify-center",
              "border border-[var(--color-hairline)] bg-white",
              "text-[var(--color-coral)]",
              "hover:bg-[var(--color-coral-tint)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]",
            ].join(" ")}
            {...setupButtonMotion(!canRemove)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SetupTextField
            label="Account holder"
            value={row.accountHolder}
            placeholder="Account holder name"
            ariaLabel={`${platformLabel} account holder ${n}`}
            ariaInvalid={Boolean(fieldErrors.accountHolder)}
            error={fieldErrors.accountHolder}
            autoComplete="name"
            disabled
            onChange={(accountHolder) => onChange({ accountHolder })}
          />
          <SetupTextField
            label="URL"
            value={row.url}
            placeholder={platformUrlPlaceholder(platform)}
            ariaLabel={`${platformLabel} URL ${n}`}
            ariaInvalid={Boolean(fieldErrors.url)}
            error={fieldErrors.url}
            onChange={(url) => onChange({ url })}
          />
          <SetupSelect
            id={`${row.id}-category`}
            label="Category"
            value={row.category}
            options={SETUP_CATEGORIES}
            placeholder="Select a category"
            ariaLabel={`${platformLabel} category ${n}`}
            ariaInvalid={Boolean(fieldErrors.category)}
            error={fieldErrors.category}
            onChange={(category) => onChange({ category })}
          />
          <SetupTextField
            label="Username"
            value={row.username}
            placeholder="Account username"
            ariaLabel={`${platformLabel} username ${n}`}
            ariaInvalid={Boolean(fieldErrors.username)}
            error={fieldErrors.username}
            autoComplete="off"
            onChange={(username) => onChange({ username })}
          />
          <SetupTextField
            label="Email"
            type="email"
            inputMode="email"
            value={row.email}
            placeholder="name@example.com"
            ariaLabel={`${platformLabel} email ${n}`}
            ariaInvalid={Boolean(fieldErrors.email)}
            error={fieldErrors.email}
            autoComplete="off"
            onChange={(email) => onChange({ email })}
          />
          <SetupTextField
            label="Mobile number"
            type="tel"
            inputMode="tel"
            value={row.mobileNumber}
            placeholder="+20 1..."
            ariaLabel={`${platformLabel} mobile number ${n}`}
            ariaInvalid={Boolean(fieldErrors.mobileNumber)}
            error={fieldErrors.mobileNumber}
            autoComplete="off"
            onChange={(mobileNumber) => onChange({ mobileNumber })}
          />
          <SetupTextField
            label="Account password"
            type="password"
            value={row.accountPassword}
            placeholder="Account password"
            ariaLabel={`${platformLabel} account password ${n}`}
            ariaInvalid={Boolean(fieldErrors.accountPassword)}
            error={fieldErrors.accountPassword}
            autoComplete="new-password"
            onChange={(accountPassword) => onChange({ accountPassword })}
          />
          <SetupTextField
            label="Email password"
            type="password"
            value={row.emailPassword}
            placeholder="Email password"
            ariaLabel={`${platformLabel} email password ${n}`}
            ariaInvalid={Boolean(fieldErrors.emailPassword)}
            error={fieldErrors.emailPassword}
            autoComplete="new-password"
            onChange={(emailPassword) => onChange({ emailPassword })}
          />
        </div>
      </motion.div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove this account?"
        description={`This will clear the data you entered for ${accountLabel}. You can add the account again afterward.`}
        confirmLabel="Remove account"
        cancelLabel="Keep editing"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onRemove();
        }}
      />
    </>
  );
}
