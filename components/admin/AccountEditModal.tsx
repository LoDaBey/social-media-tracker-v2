"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  createAdminSocialAccount,
  updateAdminSocialAccount,
} from "@/actions/admin-accounts";
import { setupAccountFieldsSchemaFor } from "@/lib/setup-schema";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { AccountFormFields } from "@/components/admin/AccountFormFields";
import type {
  AccountEditModalProps,
  AdminSocialAccountInput,
} from "@/types/admin";

export function AccountEditModal({
  open,
  mode,
  holderId,
  holderName,
  initial,
  accountId,
  holderOptions,
  onClose,
  onSaved,
  save,
}: AccountEditModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <AccountEditModalDialog
          mode={mode}
          holderId={holderId}
          holderName={holderName}
          initial={initial}
          accountId={accountId}
          holderOptions={holderOptions}
          onClose={onClose}
          onSaved={onSaved}
          save={save}
        />
      ) : null}
    </AnimatePresence>
  );
}

function AccountEditModalDialog({
  mode,
  holderId,
  holderName,
  initial,
  accountId,
  holderOptions,
  onClose,
  onSaved,
  save,
}: Omit<AccountEditModalProps, "open">) {
  const router = useRouter();
  const [value, setValue] = useState<AdminSocialAccountInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof AdminSocialAccountInput, string>>
  >({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function submit() {
    setError(null);
    const parsed = setupAccountFieldsSchemaFor(value.platform).safeParse({
      accountHolder: value.accountHolder,
      url: value.url,
      category: value.category,
      username: value.username,
      email: value.email,
      accountPassword: value.accountPassword,
      emailPassword: value.emailPassword,
      mobileNumber: value.mobileNumber,
    });
    if (!parsed.success) {
      const next: Partial<Record<keyof AdminSocialAccountInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as keyof AdminSocialAccountInput] = issue.message;
        }
      }
      setFieldErrors(next);
      setError(parsed.error.issues[0]?.message ?? "Please review the form.");
      return;
    }
    setFieldErrors({});

    startTransition(async () => {
      const result = save
        ? await save(value)
        : mode === "create"
          ? await createAdminSocialAccount(holderId, value)
          : await updateAdminSocialAccount(accountId!, value);
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(
        mode === "create"
          ? `Account added for ${holderName}.`
          : "Account updated."
      );
      onClose();
      onSaved?.();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close account editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-edit-modal-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-3xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="account-edit-modal-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              {mode === "create" ? "Add account" : "Edit account"}
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              {value.accountHolder || holderName}
              {mode === "edit"
                ? ` · ${PLATFORM_LABELS[value.platform]}`
                : ""}
            </p>
          </div>
          <motion.button
            type="button"
            aria-label="Close account editor"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <AccountFormFields
            value={value}
            fieldErrors={fieldErrors}
            platformLocked={mode === "edit" && !save}
            holderOptions={holderOptions}
            onChange={(patch) => setValue((prev) => ({ ...prev, ...patch }))}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={onClose}
            aria-label="Cancel account editor"
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
          >
            Cancel
          </motion.button>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={submit}
            aria-label={mode === "create" ? "Save new account" : "Save account changes"}
            className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
