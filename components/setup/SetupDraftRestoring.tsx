export function SetupDraftRestoring() {
  return (
    <div
      className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-6"
      style={{ paddingBlockStart: 28 }}
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only">Restoring your setup progress</p>
      <div className="flex flex-col items-center">
        <div
          className="animate-pulse rounded-full bg-[var(--color-cream-tint)]"
          style={{ width: 56, height: 56 }}
        />
        <div className="mt-4 h-8 w-64 max-w-full animate-pulse rounded-lg bg-[var(--color-cream-tint)]" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-lg bg-[var(--color-cream-tint)]" />
        <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-[var(--color-cream-tint)]" />
      </div>
      <div className="mt-8 min-h-[240px] animate-pulse rounded-2xl bg-[var(--color-cream-tint)]" />
    </div>
  );
}
