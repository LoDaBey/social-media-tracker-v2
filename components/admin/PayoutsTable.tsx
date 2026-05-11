"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { processPayout } from "@/actions/admin";
import type { AdminPayoutRow } from "@/types/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Props = {
  rows: AdminPayoutRow[];
};

function statusChipClass(status: AdminPayoutRow["status"]) {
  if (status === "Ready to pay") return "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]";
  if (status === "Overdue") return "bg-[var(--color-coral-tint)] text-[var(--color-coral)]";
  return "bg-[var(--color-cream-tint)] text-[var(--color-muted)]";
}

export function PayoutsTable({ rows }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [batchError, setBatchError] = useState<string | null>(null);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.id)),
    [rows, selected]
  );

  const totalEgp = useMemo(
    () => selectedRows.reduce((s, r) => s + Math.max(0, r.net_balance), 0),
    [selectedRows]
  );

  const n = selected.size;

  function runBatch() {
    setBatchError(null);
    startTransition(async () => {
      try {
        await processPayout([...selected], { force: false });
        setDialogOpen(false);
        setSelected(new Set());
        router.refresh();
      } catch (e) {
        setBatchError(e instanceof Error ? e.message : "Batch payout failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {batchError ? (
        <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-2 text-[14px] text-[var(--color-coral)]">
          {batchError}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[var(--color-muted)]">
          {n > 0 ? `${n} employee${n === 1 ? "" : "s"} selected` : "Select employees to process payouts."}
        </p>
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={n === 0}
          onClick={() => setDialogOpen(true)}
          aria-label={`Open confirmation to process ${n} payouts`}
          className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Process {n} payout{n === 1 ? "" : "s"}
        </motion.button>
      </div>

      <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-hairline)]">
            <tr className="text-[12px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              <th scope="col" className="w-10 px-3 py-3">
                <span className="sr-only">Select</span>
              </th>
              <th scope="col" className="px-3 py-3">
                Name
              </th>
              <th scope="col" className="px-3 py-3">
                Net balance
              </th>
              <th scope="col" className="px-3 py-3">
                Days to payout
              </th>
              <th scope="col" className="px-3 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)]"
              >
                <td className="px-3 py-3 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    aria-label={`Select ${r.full_name} for payout`}
                    className="cursor-pointer rounded border-[var(--color-hairline)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  />
                </td>
                <td className="px-3 py-3">
                  <p className="text-[14px] font-semibold text-[var(--color-ink)]">{r.full_name}</p>
                  <p className="text-[12px] text-[var(--color-muted)]">{r.email}</p>
                </td>
                <td className="px-3 py-3 text-[14px] font-semibold tabular-nums text-[var(--color-ink)]">
                  {Math.round(r.net_balance).toLocaleString("en-US")} EGP
                </td>
                <td className="px-3 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
                  {r.days_to_payout}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusChipClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Process payouts"
        description={`Process payouts for ${n} employee${n === 1 ? "" : "s"} totaling EGP ${Math.round(totalEgp).toLocaleString("en-US")}?`}
        confirmLabel="Process payouts"
        cancelLabel="Go back"
        pending={pending}
        onCancel={() => setDialogOpen(false)}
        onConfirm={runBatch}
      />
    </div>
  );
}
