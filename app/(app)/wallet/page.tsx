import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Info, Wallet } from "lucide-react";
import { auth } from "@/auth";
import { queryOne } from "@/lib/db";
import { computeWallet } from "@/lib/wallet";
import {
  fetchWalletDailyGrowthStatus,
  fetchWalletHistoryCycles,
  fetchWalletTransactionsThisCycle,
} from "@/lib/wallet-page-data";
import type { TempUser } from "@/types/db";
import {
  addDaysToIsoDate,
  formatShortDate,
  getTodayCairoDate,
  normalizePgDateColumn,
} from "@/lib/cairo-date";
import { WalletHero } from "@/components/wallet/WalletHero";
import { CycleTimeline } from "@/components/wallet/CycleTimeline";
import { WalletTabs } from "@/components/wallet/WalletTabs";
import { TransactionRow } from "@/components/wallet/TransactionRow";
import { HistoryRow } from "@/components/wallet/HistoryRow";
import { ScrollToWalletHighlight } from "@/components/wallet/ScrollToWalletHighlight";

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) redirect("/login");

  const sp = searchParams ? await searchParams : {};
  const rawHighlight = sp.highlight;
  const highlightStr = Array.isArray(rawHighlight) ? rawHighlight[0] : rawHighlight;
  const highlightParsed = highlightStr != null ? Number(highlightStr) : NaN;
  const highlightTxId = Number.isFinite(highlightParsed) ? highlightParsed : null;

  const user = await queryOne<TempUser>(
    `SELECT *
       FROM temp_users
      WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );
  if (!user) redirect("/login");

  const todayCairo = getTodayCairoDate();
  const cycleStartStr = normalizePgDateColumn(user.pay_cycle_start_date);

  const [wallet, transactions, historyCycles, dailyGrowth] = await Promise.all([
    computeWallet(user),
    fetchWalletTransactionsThisCycle(userId, cycleStartStr),
    fetchWalletHistoryCycles(userId, cycleStartStr),
    fetchWalletDailyGrowthStatus(userId, cycleStartStr),
  ]);

  const cycleEndLabel =
    cycleStartStr != null ? formatShortDate(addDaysToIsoDate(cycleStartStr, 30)) : null;

  const thisCyclePanel = (
    <section aria-label="This cycle activity">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold text-[var(--color-ink)]">Activity</h2>
        <button
          type="button"
          aria-label="Filter activity (coming soon)"
          className="cursor-pointer rounded-full bg-[var(--color-cream-tint)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-muted)] outline-none hover:bg-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          All ▾
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {transactions.length === 0 ? (
          <p className="py-14 text-center text-[14px] font-medium text-[var(--color-muted)]">
            No activity this cycle yet. Submissions will appear here as they&apos;re reviewed.
          </p>
        ) : (
          transactions.map((row) => (
            <TransactionRow
              key={row.id}
              row={row}
              highlighted={highlightTxId != null && row.id === highlightTxId}
            />
          ))
        )}
      </div>
    </section>
  );

  const historyPanel = (
    <section aria-label="Wallet history">
      <div className="flex flex-col gap-2">
        {historyCycles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-[14px] font-medium text-[var(--color-muted)]">
            <Wallet className="h-9 w-9 opacity-35" aria-hidden="true" />
            <p>Your first payout will show up here next month.</p>
          </div>
        ) : (
          historyCycles.map((row) => <HistoryRow key={row.cycle_start_date} row={row} />)
        )}
      </div>
    </section>
  );

  return (
    <main className="w-full">
      <div className="mx-auto w-full max-w-[960px]">
        <Link
          href="/dashboard"
          className="inline-flex cursor-pointer rounded-lg text-[14px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          aria-label="Back to dashboard"
        >
          ← Back to dashboard
        </Link>
      </div>

      <WalletHero wallet={wallet} />

      <CycleTimeline
        cycleStart={cycleStartStr}
        todayCairo={todayCairo}
        daily={dailyGrowth}
        cycleEndLabel={cycleEndLabel}
      />

      <Suspense
        fallback={
          <div className="mx-auto mt-8 min-h-[120px] w-full max-w-[960px] rounded-2xl bg-[var(--color-cream-tint)]" />
        }
      >
        {highlightTxId != null ? (
          <ScrollToWalletHighlight transactionId={highlightTxId} />
        ) : null}
        <WalletTabs thisCyclePanel={thisCyclePanel} historyPanel={historyPanel} />
      </Suspense>

      <div
        className="mx-auto mt-10 flex w-full max-w-[960px] items-start gap-3 rounded-2xl bg-[var(--color-cream-tint)] px-6 py-5"
        style={{ boxShadow: "0 1px 2px rgba(20,20,20,.04)" }}
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
        <p className="text-[14px] font-normal text-[var(--color-muted)]">
          Wallets pay out at the end of every 30-day cycle. Need help? Talk to your team lead.
        </p>
      </div>
    </main>
  );
}
