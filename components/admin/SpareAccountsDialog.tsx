"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { setAdminSocialAccountSpare } from "@/actions/admin-accounts";
import {
  emptySpareAccountFilters,
  filterSpareAccounts,
  filterSpareMarkHolders,
  spareAccountFiltersActive,
  spareAccountKey,
} from "@/lib/admin-spare";
import { SpareAccountsFilters } from "@/components/admin/SpareAccountsFilters";
import { SpareAccountsList } from "@/components/admin/SpareAccountsList";
import { SpareAccountsMarkPanel } from "@/components/admin/SpareAccountsMarkPanel";
import type {
  AdminSpareAccountListItem,
  SpareAccountFilters,
  SpareAccountsDialogProps,
  SpareModalTab,
} from "@/types/admin";

export function SpareAccountsDialog({
  onClose,
  accounts: initialAccounts,
  holders,
}: SpareAccountsDialogProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SpareModalTab>("spare");
  const [accounts, setAccounts] =
    useState<AdminSpareAccountListItem[]>(initialAccounts);
  const [filters, setFilters] = useState<SpareAccountFilters>(
    emptySpareAccountFilters
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const filteredAccounts = filterSpareAccounts(accounts, filters);
  const filteredHolders = filterSpareMarkHolders(holders, filters);
  const filtersActive = spareAccountFiltersActive(filters);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function unmark(account: AdminSpareAccountListItem) {
    const label =
      account.username || account.account_name || account.account_url || "Account";
    const rowKey = spareAccountKey(account.source, account.id);
    setPendingKey(rowKey);
    startTransition(async () => {
      const result = await setAdminSocialAccountSpare(
        account.id,
        false,
        account.source
      );
      setPendingKey(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAccounts((prev) =>
        prev.filter(
          (row) => spareAccountKey(row.source, row.id) !== rowKey
        )
      );
      toast.success(`${label} unmarked as spare.`);
      router.refresh();
    });
  }

  function handleSpareChange(
    item: AdminSpareAccountListItem,
    isSpare: boolean
  ) {
    const rowKey = spareAccountKey(item.source, item.id);
    setAccounts((prev) => {
      const without = prev.filter(
        (row) => spareAccountKey(row.source, row.id) !== rowKey
      );
      return isSpare ? [...without, item] : without;
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close spare accounts dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="spare-accounts-modal-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-5xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="spare-accounts-modal-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Spare accounts
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              Mark or unmark spare accounts for Africa, Europe, and ALPHAA
              handlers. They stay on handlers but count as extras in KPIs.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close spare accounts"
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="View current spare accounts"
            aria-pressed={tab === "spare"}
            onClick={() => setTab("spare")}
            className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              tab === "spare"
                ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                : "bg-[var(--color-cream-tint)] text-[var(--color-ink)]"
            }`}
          >
            Current spare (
            {filtersActive
              ? `${filteredAccounts.length} of ${accounts.length}`
              : accounts.length}
            )
          </motion.button>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Mark a handler account as spare"
            aria-pressed={tab === "mark"}
            onClick={() => setTab("mark")}
            className={`cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              tab === "mark"
                ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
                : "bg-[var(--color-cream-tint)] text-[var(--color-ink)]"
            }`}
          >
            Mark spare
          </motion.button>
        </div>

        <SpareAccountsFilters
          accounts={accounts}
          holders={holders}
          value={filters}
          onChange={setFilters}
        />

        {tab === "spare" ? (
          <SpareAccountsList
            accounts={filteredAccounts}
            pendingKey={pendingKey}
            pending={pending}
            onUnmark={unmark}
            emptyMessage={
              accounts.length > 0 && filtersActive
                ? "No spare accounts match these filters."
                : undefined
            }
          />
        ) : (
          <SpareAccountsMarkPanel
            holders={filteredHolders}
            filters={filters}
            onSpareChange={handleSpareChange}
          />
        )}
      </motion.div>
    </div>
  );
}
