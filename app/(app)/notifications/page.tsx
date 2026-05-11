import Link from "next/link";

export default function NotificationsPlaceholderPage() {
  return (
    <main className="mx-auto w-full max-w-lg py-10">
      <h1 className="text-[22px] font-bold text-[var(--color-ink)]">Notifications</h1>
      <p className="mt-3 text-[14px] font-normal text-[var(--color-muted)]">
        Full notification history is not available yet. Use the bell in the header for recent
        activity.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex cursor-pointer rounded-lg text-[14px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        aria-label="Back to dashboard"
      >
        ← Back to dashboard
      </Link>
    </main>
  );
}
