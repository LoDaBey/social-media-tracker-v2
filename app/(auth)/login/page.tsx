import { Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

type Props = {
  searchParams?: Promise<{
    error?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const sp = (await searchParams) ?? {};
  const errorParam = sp.error;
  const error = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const initialCredentialsError = error === "CredentialsSignin";

  return (
    <main className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute blur-[200px]"
        style={{
          insetBlockStart: -160,
          insetInlineEnd: -160,
          width: 520,
          height: 520,
          background:
            "radial-gradient(circle at 30% 30%, rgb(from var(--color-emerald) r g b / 0.06), transparent 60%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[440px]">
        <section
          className="bg-[var(--color-surface)] p-12"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow:
              "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
          }}
        >
          <header className="flex flex-col items-start">
            <div className="flex w-full flex-col items-center gap-2 text-center">
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-bold text-[var(--color-ink)]">
                  ALPHAA
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  EMPLOYEE PORTAL
                </p>
              </div>
            </div>

            <div className="h-10" />

            <div className="flex w-full flex-col items-center gap-2 text-center">
              <h1 className="text-[32px] font-extrabold text-center text-[var(--color-ink)] leading-tight">
                Welcome back
              </h1>
              <p className="text-[15px] font-normal text-center text-[var(--color-muted)]">
                Sign in to log today&apos;s work.
              </p>
            </div>
          </header>

          <div className="h-8" />

          <LoginForm initialCredentialsError={initialCredentialsError} />

          <div className="my-6 h-px w-full bg-[var(--color-hairline)]" />

          <p className="text-center text-[13px] font-normal text-[var(--color-muted)]">
            First time here? Ask your team lead for credentials.
          </p>
        </section>

        <footer className="mt-5 flex flex-col items-center gap-2">
          <p className="text-[11px] text-[var(--color-muted)]">v1.0</p>
        </footer>
      </div>
    </main>
  );
}

