"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Lock } from "lucide-react";
import { changePasswordAction } from "@/actions/settings";
import type { ChangePasswordFormProps, ChangePasswordState } from "@/types/settings";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <motion.button
      type="submit"
      aria-label={pending ? "Updating password" : "Update password"}
      aria-busy={pending}
      disabled={pending}
      layout
      whileHover={pending ? undefined : { scale: 1.05 }}
      whileTap={pending ? undefined : { scale: 0.95 }}
      className={[
        "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg px-5",
        "bg-[var(--color-emerald)] text-[15px] font-bold text-white",
        "hover:bg-[var(--color-emerald-hover)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        "disabled:cursor-wait disabled:opacity-70",
      ].join(" ")}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Updating…
        </>
      ) : (
        "Update password"
      )}
    </motion.button>
  );
}

function PasswordField({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--color-muted)]"
      >
        {label}
      </label>
      <div className="relative">
        <Lock
          className="absolute top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
          style={{ insetInlineStart: 14 }}
          size={18}
          aria-hidden="true"
        />
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          className={[
            "h-[52px] w-full rounded-lg outline-none",
            "border border-[var(--color-hairline)]",
            "bg-[var(--color-surface)]",
            "text-[15px] text-[var(--color-ink)]",
            "transition",
            "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
            "focus-visible:bg-[var(--color-cream-tint)]",
          ].join(" ")}
          style={{
            paddingInlineStart: 44,
            paddingInlineEnd: 78,
          }}
          aria-label={label}
        />
        <button
          type="button"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setVisible((value) => !value)}
          className={[
            "cursor-pointer rounded-lg",
            "absolute top-1/2 -translate-y-1/2",
            "px-2 py-1 text-[13px] font-semibold text-[var(--color-emerald)]",
            "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
          ].join(" ")}
          style={{ insetInlineEnd: 10 }}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
  const initialState = useMemo<ChangePasswordState>(
    () => ({ error: null, success: null }),
    []
  );
  const [state, formAction] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex max-w-lg flex-col gap-4">
      <p className="text-[14px] text-[var(--color-muted)]">
        Signed in as <span className="font-semibold text-[var(--color-ink)]">{email}</span>
      </p>

      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-coral-tint)] px-3 py-2">
          <AlertCircle
            className="h-4 w-4 text-[var(--color-coral)]"
            aria-hidden="true"
          />
          <p className="text-[13px] font-medium text-[var(--color-coral)]">
            {state.error}
          </p>
        </div>
      ) : null}

      {state.success ? (
        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-emerald-tint)] px-3 py-2">
          <CheckCircle2
            className="h-4 w-4 text-[var(--color-emerald)]"
            aria-hidden="true"
          />
          <p className="text-[13px] font-medium text-[var(--color-emerald)]">
            {state.success}
          </p>
        </div>
      ) : null}

      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Current password"
        autoComplete="current-password"
      />
      <PasswordField
        id="newPassword"
        name="newPassword"
        label="New password"
        autoComplete="new-password"
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
      />

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
