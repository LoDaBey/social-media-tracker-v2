export function WaitingForManagerSetup() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center text-center">
      <h1 className="text-[28px] font-extrabold text-[var(--color-ink)]">
        Setup in progress
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">
        Your manager is still filling in your social media accounts. You&apos;ll
        get access to your dashboard as soon as setup is complete.
      </p>
    </main>
  );
}
