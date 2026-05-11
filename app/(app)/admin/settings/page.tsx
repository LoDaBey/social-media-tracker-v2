export default function AdminSettingsPage() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-[32px] font-extrabold text-[var(--color-ink)]">Settings</h1>
      <section
        className="max-w-2xl rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-6"
        style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
      >
        <h2 className="text-[18px] font-bold text-[var(--color-ink)]">Platform defaults</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-muted)]">
          Platform default targets are hardcoded in{" "}
          <code className="rounded-md bg-[var(--color-cream-tint)] px-2 py-0.5 text-[13px] font-semibold text-[var(--color-ink)]">
            lib/platform-config.ts
          </code>
          . Open that file in your editor to review or change defaults. Editing them at runtime is on
          the roadmap.
        </p>
      </section>
    </main>
  );
}
