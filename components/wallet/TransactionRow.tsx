import type { ReactNode } from "react";
import Link from "next/link";
import { DollarSign, Minus, Sparkles, Star, Wallet } from "lucide-react";
import type { WalletTransactionListRow } from "@/types/wallet";
import { formatShortDate } from "@/lib/cairo-date";

type Props = {
  row: WalletTransactionListRow;
  highlighted?: boolean;
};

function formatSignedEgp(amount: number, type: WalletTransactionListRow["type"]) {
  const abs = Math.abs(Math.round(amount));
  const s = abs.toLocaleString("en-US");
  if (type === "base_salary" || type === "payout") {
    const prefix = amount < 0 ? "−" : "+";
    return { text: `${prefix}${s} EGP`, sign: "neutral" as const };
  }
  if (type === "deduction" || amount < 0) {
    return { text: `−${s} EGP`, sign: "debit" as const };
  }
  return { text: `+${s} EGP`, sign: "credit" as const };
}

export function TransactionRow({ row, highlighted }: Props) {
  const amountNum = Number(row.amount);
  const formatted = formatSignedEgp(amountNum, row.type);
  const createdLabel = row.created_by_name ?? "system";
  const dateLine = formatShortDate(row.created_at);

  let icon: ReactNode;
  let circleClass = "bg-[var(--color-cream-tint)] text-[var(--color-ink)]";

  if (row.type === "bonus") {
    circleClass = "bg-[#FFF5D8] text-[var(--color-gold)]";
    icon = <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />;
  } else if (row.type === "level_adjustment") {
    circleClass = "bg-[#FFF5D8] text-[var(--color-gold)]";
    icon = <Star className="h-[18px] w-[18px]" aria-hidden="true" />;
  } else if (row.type === "deduction") {
    circleClass = "bg-[var(--color-coral-tint)] text-[var(--color-coral)]";
    icon = <Minus className="h-[18px] w-[18px]" aria-hidden="true" />;
  } else if (row.type === "payout") {
    icon = <DollarSign className="h-[18px] w-[18px]" aria-hidden="true" />;
  } else {
    icon = <Wallet className="h-[18px] w-[18px]" aria-hidden="true" />;
  }

  const amountColor =
    formatted.sign === "credit"
      ? "text-[var(--color-gold)]"
      : formatted.sign === "debit"
        ? "text-[var(--color-coral)]"
        : "text-[var(--color-ink)]";

  const whyTitle =
    row.qc_comment?.trim() ||
    (row.related_growth_id ? "View quality review context for this deduction." : undefined);

  return (
    <article
      data-tx-id={row.id}
      className={[
        "flex gap-4 rounded-2xl bg-[var(--color-surface)] px-5 py-[18px] transition-shadow",
        highlighted
          ? "ring-2 ring-[var(--color-emerald)] ring-offset-2 ring-offset-[var(--color-cream)]"
          : "",
      ].join(" ")}
      style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${circleClass}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[var(--color-ink)]">{row.reason}</p>
        <p className="mt-1 text-[13px] font-normal text-[var(--color-muted)]">
          {dateLine} · {createdLabel}
          {row.related_growth_id ? (
            <>
              {" · "}
              <Link
                href={`/qc?selected=${row.related_growth_id}`}
                className="cursor-pointer rounded underline decoration-[var(--color-hairline)] outline-none underline-offset-2 hover:decoration-[var(--color-emerald)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                title={whyTitle}
                aria-label="Why was this deduction applied? Opens QC context."
              >
                Why?
              </Link>
            </>
          ) : null}
        </p>
      </div>

      <div className={`shrink-0 text-[18px] font-extrabold tabular-nums ${amountColor}`}>
        {formatted.text}
      </div>
    </article>
  );
}
