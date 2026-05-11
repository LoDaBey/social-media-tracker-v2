import { Check, FileText, Gift, MinusCircle, Wallet } from "lucide-react";
import { formatShortDate } from "@/lib/cairo-date";
import { fetchEmployeeActivityTimeline } from "@/lib/admin-data";

type Props = {
  userId: number;
};

function iconFor(kind: string) {
  if (kind === "submission") return FileText;
  if (kind === "qc") return Check;
  if (kind === "bonus") return Gift;
  if (kind === "payout") return Wallet;
  if (kind === "deduction") return MinusCircle;
  return Wallet;
}

export async function AdminEmployeeActivity({ userId }: Props) {
  const items = await fetchEmployeeActivityTimeline(userId);

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[var(--color-muted)]">No activity yet.</p>
      ) : (
        items.map((row, i) => {
          const Icon = iconFor(row.kind);
          return (
            <article
              key={`${row.created_at}-${i}`}
              className="flex gap-4 rounded-2xl bg-[var(--color-surface)] px-5 py-4"
              style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream-tint)] text-[var(--color-emerald)]"
                aria-hidden="true"
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[var(--color-ink)]">{row.description}</p>
                <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                  {formatShortDate(row.created_at)}
                </p>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
