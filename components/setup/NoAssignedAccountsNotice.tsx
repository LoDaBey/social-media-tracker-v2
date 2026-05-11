import { AlertCircle } from "lucide-react";

export function NoAssignedAccountsNotice() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
      <div
        className="flex items-center justify-center rounded-full bg-[var(--color-coral-tint)] text-[var(--color-coral)]"
        style={{ width: 64, height: 64 }}
        aria-hidden="true"
      >
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="mt-5 text-[32px] font-extrabold leading-tight text-[var(--color-ink)]">
        Account setup required
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-muted)]">
        You cannot access the dashboard until your assigned social media accounts are set up.
        Ask your admin or team lead to assign your account targets, then come back here to
        complete setup.
      </p>
    </main>
  );
}
