import type {
  BalanceCoverageResultProps,
  BalanceCoverageSpareChange,
  BalanceCoverageSpareGap,
} from "@/types/admin";

function groupChanges(rows: BalanceCoverageSpareChange[]) {
  const groups = new Map<string, BalanceCoverageSpareChange[]>();
  for (const row of rows) {
    const key = `${row.country} · ${row.platformLabel}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.entries()];
}

function groupGaps(rows: BalanceCoverageSpareGap[]) {
  const groups = new Map<string, BalanceCoverageSpareGap[]>();
  for (const row of rows) {
    const list = groups.get(row.country) ?? [];
    list.push(row);
    groups.set(row.country, list);
  }
  return [...groups.entries()];
}

function accountLabel(row: BalanceCoverageSpareChange) {
  return row.username?.trim() || `Account ${row.accountId}`;
}

export function BalanceCoverageResult({ result }: BalanceCoverageResultProps) {
  if (result.error) {
    return (
      <p className="rounded-lg bg-[var(--color-coral)]/10 px-4 py-3 text-[14px] text-[var(--color-coral)]">
        {result.error}
      </p>
    );
  }

  const hasChanges = result.marked.length > 0 || result.unmarked.length > 0;
  const hasMissing = result.missing.length > 0;

  if (!hasChanges && !hasMissing) {
    return (
      <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
        Every country already matches its platform plan. No spare changes needed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {result.applied ? (
        <p className="rounded-lg bg-[var(--color-emerald-tint)] px-4 py-3 text-[14px] text-[var(--color-ink)]">
          Spare flags updated. Coverage totals now follow the plan where extras
          existed.
        </p>
      ) : null}

      {result.marked.length > 0 ? (
        <section aria-label="Accounts to mark as spare">
          <h3 className="text-[15px] font-bold text-[var(--color-ink)]">
            {result.applied ? "Marked spare" : "Will mark spare"} (
            {result.marked.length})
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {groupChanges(result.marked).map(([label, rows]) => (
              <li
                key={label}
                className="rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] text-[var(--color-ink)]"
              >
                <p className="font-semibold">
                  {label} · {rows.length}
                </p>
                <p className="mt-1 text-[var(--color-muted)]">
                  {rows
                    .map((row) => `${row.handlerName} (${accountLabel(row)})`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.unmarked.length > 0 ? (
        <section aria-label="Accounts to unmark as spare">
          <h3 className="text-[15px] font-bold text-[var(--color-ink)]">
            {result.applied ? "Unmarked spare" : "Will unmark spare"} (
            {result.unmarked.length})
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {groupChanges(result.unmarked).map(([label, rows]) => (
              <li
                key={label}
                className="rounded-lg border border-[var(--color-hairline)] px-3 py-2 text-[13px] text-[var(--color-ink)]"
              >
                <p className="font-semibold">
                  {label} · {rows.length}
                </p>
                <p className="mt-1 text-[var(--color-muted)]">
                  {rows
                    .map((row) => `${row.handlerName} (${accountLabel(row)})`)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasMissing ? (
        <section aria-label="Countries missing accounts">
          <h3 className="text-[15px] font-bold text-[var(--color-ink)]">
            Missing accounts to reach the plan
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {groupGaps(result.missing).map(([country, rows]) => (
              <li
                key={country}
                className="rounded-lg border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/5 px-3 py-2 text-[13px] text-[var(--color-ink)]"
              >
                <p className="font-semibold">{country}</p>
                <ul className="mt-1 flex flex-col gap-1 text-[var(--color-muted)]">
                  {rows.map((row) => (
                    <li key={`${row.country}-${row.platform}`}>
                      {row.platformLabel}: {row.actual} of {row.target} on plan,
                      short {row.missing}
                      {row.spareAvailable === 0
                        ? " · no spare accounts"
                        : ` · still short after using ${row.spareAvailable} spare`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
