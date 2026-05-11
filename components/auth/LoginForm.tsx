"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight, Loader2, Mail } from "lucide-react";
import { signInAction } from "@/actions/auth";

type Props = {
  initialCredentialsError?: boolean;
};

type FormState = { error: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label="Sign in"
      disabled={pending}
      className={[
        "cursor-pointer rounded-lg",
        "h-[52px] w-full rounded-[var(--radius-button)]",
        "bg-[var(--color-emerald)] text-white",
        "font-[var(--font-cairo)] font-bold text-[16px]",
        "flex items-center justify-center gap-2",
        "transition-colors",
        "hover:bg-[var(--color-emerald-hover)]",
        "disabled:opacity-70 disabled:cursor-not-allowed",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
      ].join(" ")}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Signing in</span>
        </>
      ) : (
        <>
          <span>Sign in</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export function LoginForm({ initialCredentialsError }: Props) {
  const initialState = useMemo<FormState>(() => ({ error: null }), []);
  const [state, formAction] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const showInlineError = Boolean(initialCredentialsError || state.error);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {showInlineError ? (
        <div className="flex items-center gap-2 rounded-full bg-[var(--color-coral-tint)] px-3 py-2">
          <AlertCircle
            className="h-4 w-4 text-[var(--color-coral)]"
            aria-hidden="true"
          />
          <p className="text-[13px] font-medium text-[var(--color-coral)]">
            Email or password incorrect. Try again.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--color-muted)]"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            className="absolute top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            style={{ insetInlineStart: 14 }}
            size={18}
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={[
              "h-[52px] w-full rounded-[var(--radius-input)] outline-none",
              "border border-[var(--color-hairline)]",
              "bg-[var(--color-surface)]",
              "text-[15px] text-[var(--color-ink)]",
              "transition",
              "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              "focus-visible:bg-[var(--color-cream-tint)]",
            ].join(" ")}
            style={{
              paddingInlineStart: 44,
              paddingInlineEnd: 14,
            }}
            placeholder="you@company.com"
            aria-label="Email"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="password"
          className="text-[13px] font-medium uppercase tracking-[0.04em] text-[var(--color-muted)]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={[
              "h-[52px] w-full rounded-[var(--radius-input)] outline-none",
              "border border-[var(--color-hairline)]",
              "bg-[var(--color-surface)]",
              "text-[15px] text-[var(--color-ink)]",
              "transition",
              "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              "focus-visible:bg-[var(--color-cream-tint)]",
            ].join(" ")}
            style={{
              paddingInlineStart: 14,
              paddingInlineEnd: 78,
            }}
            placeholder="••••••••"
            aria-label="Password"
          />

          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
            className={[
              "cursor-pointer rounded-lg",
              "absolute top-1/2 -translate-y-1/2",
              "text-[13px] font-semibold text-[var(--color-emerald)]",
              "px-2 py-1",
              "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
            ].join(" ")}
            style={{ insetInlineEnd: 10 }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex justify-end">
          <a
            href="#"
            aria-label="Forgot password"
            className="text-[13px] font-semibold text-[var(--color-emerald)]"
          >
            Forgot password?
          </a>
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}

