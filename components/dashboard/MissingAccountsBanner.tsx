import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PLATFORM_LABELS, type Platform } from "@/lib/platform-config";

type Props = {
  missingAccounts: Partial<Record<Platform, number>>;
};

function missingSentence(missingAccounts: Partial<Record<Platform, number>>) {
  const entries = Object.entries(missingAccounts) as [Platform, number][];
  const visible = entries.filter(([, count]) => count > 0);

  if (visible.length === 0) return null;

  if (visible.length === 1) {
    const [platform, count] = visible[0];
    return `You're missing ${count} ${PLATFORM_LABELS[platform]} ${
      count === 1 ? "account" : "accounts"
    }.`;
  }

  const platforms = visible
    .map(([platform, count]) => `${count} ${PLATFORM_LABELS[platform]}`)
    .join(", ");

  return `You're missing ${platforms} accounts.`;
}

export function MissingAccountsBanner({ missingAccounts }: Props) {
  const sentence = missingSentence(missingAccounts);
  if (!sentence) return null;

  return (
    <section
      className="mt-6 flex flex-col gap-4 bg-[var(--color-coral-tint)] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      style={{ borderRadius: 16 }}
      aria-label="Missing accounts"
    >
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-coral)]"
          aria-hidden="true"
        />
        <div>
          <p className="text-[16px] font-bold text-[var(--color-ink)]">{sentence}</p>
          <p className="mt-1 text-[14px] font-normal text-[var(--color-muted)]">
            Add them to start logging work.
          </p>
        </div>
      </div>

      <Link
        href="/setup"
        aria-label="Add missing accounts"
        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg bg-[var(--color-coral)] px-5 text-[14px] font-bold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
      >
        Add accounts
      </Link>
    </section>
  );
}
