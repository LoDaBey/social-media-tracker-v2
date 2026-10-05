import type { ExtractSummaryProps } from "@/types/admin";

function BucketList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[14px] bg-[var(--color-cream-tint)] p-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {title}
        </p>
        <p className="mt-2 text-[13px] text-[var(--color-muted)]">No data</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] bg-[var(--color-cream-tint)] p-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {title}
      </p>
      <ul className="mt-2 flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="min-w-0 truncate font-medium text-[var(--color-ink)]">
              {item.label}
            </span>
            <span className="shrink-0 tabular-nums font-extrabold text-[var(--color-ink)]">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExtractSummary({ summary }: ExtractSummaryProps) {
  if (!summary) return null;

  return (
    <section
      aria-label="Extract summary"
      className="flex flex-col gap-3 rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-5"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Total matching accounts
          </p>
          <p className="text-[32px] font-extrabold tabular-nums leading-none text-[var(--color-ink)]">
            {summary.total}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BucketList title="By region" items={summary.byRegion} />
        <BucketList title="By country" items={summary.byCountry} />
        <BucketList title="By platform" items={summary.byPlatform} />
        <BucketList title="By account type" items={summary.byScope} />
      </div>
    </section>
  );
}
