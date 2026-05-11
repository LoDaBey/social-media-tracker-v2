import { CalendarCheck } from "lucide-react";
import type { WalletHistoryCycleAggregate } from "@/types/wallet";
import { formatCycleMonthYear } from "@/lib/cairo-date";
import { HistoryDownloadButton } from "@/components/wallet/HistoryDownloadButton";

type Props = {
  row: WalletHistoryCycleAggregate;
};

function formatNetEgp(net: string) {
  const n = Math.round(Number(net));
  const sign = n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toLocaleString("en-US")}`;
}

export function HistoryRow({ row }: Props) {
  const monthYear = formatCycleMonthYear(row.cycle_start_date);
  const net = formatNetEgp(row.net);
  const count = Number(row.txn_count);

  return (
    <article
      className="flex gap-4 rounded-2xl bg-[var(--color-surface)] px-5 py-[18px]"
      style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAF8F2] text-[var(--color-ink)]"
        aria-hidden="true"
      >
        <CalendarCheck className="h-[18px] w-[18px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[var(--color-ink)]">{monthYear}</p>
        <p className="mt-1 text-[13px] font-normal text-[var(--color-muted)]">
          {row.is_paid ? "Paid" : "Closed · pending payout"} · {count}{" "}
          {count === 1 ? "entry" : "entries"} · Net {net} EGP
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {row.is_paid ? (
          <span className="rounded-full bg-[var(--color-emerald-tint)] px-3 py-1 text-[11px] font-semibold text-[var(--color-emerald)]">
            Paid ✓
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-coral-tint)] px-3 py-1 text-[11px] font-semibold text-[var(--color-coral)]">
            Pending
          </span>
        )}
        <HistoryDownloadButton />
      </div>
    </article>
  );
}
