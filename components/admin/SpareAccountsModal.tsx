"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { setAdminSocialAccountSpare } from "@/actions/admin-accounts";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { AccountCategoryBadge } from "@/components/admin/AccountCategoryBadge";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type {
  AdminSpareAccountListItem,
  SpareAccountsModalProps,
} from "@/types/admin";

export function SpareAccountsModal({
  open,
  onClose,
  accounts: initialAccounts,
}: SpareAccountsModalProps) {
  const router = useRouter();
  const [accounts, setAccounts] =
    useState<AdminSpareAccountListItem[]>(initialAccounts);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) setAccounts(initialAccounts);
  }, [open, initialAccounts]);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  function unmark(account: AdminSpareAccountListItem) {
    const label =
      account.username || account.account_name || account.account_url || "Account";
    setPendingId(account.id);
    startTransition(async () => {
      const result = await setAdminSocialAccountSpare(account.id, false);
      setPendingId(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setAccounts((prev) => prev.filter((row) => row.id !== account.id));
      toast.success(`${label} unmarked as spare.`);
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {open ? (
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
                  Africa and Europe accounts marked as spare. They stay on
                  handlers but count as extras in KPIs.
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

            {accounts.length === 0 ? (
              <p className="mt-6 rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
                No spare accounts right now.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-[16px] border border-[var(--color-hairline)]">
                <table className="w-full min-w-[800px] border-collapse text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      <th scope="col" className="px-4 py-2">
                        Handler
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Country
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Platform
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Username
                      </th>
                      <th scope="col" className="px-4 py-2">
                        URL
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Category
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-2">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => {
                      const label =
                        account.username ||
                        account.account_name ||
                        account.account_url ||
                        "Account";
                      const busy = pending && pendingId === account.id;
                      return (
                        <tr
                          key={account.id}
                          className="border-t border-[var(--color-hairline)]"
                        >
                          <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
                            {account.handler_name}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                            {account.country || "—"}
                            {account.region ? (
                              <span className="block text-[11px] text-[var(--color-muted)]">
                                {account.region}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                            {PLATFORM_LABELS[account.platform]}
                          </td>
                          <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                            {account.username || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-[13px]">
                            <AccountUrlCell
                              url={account.account_url}
                              label={label}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <AccountCategoryBadge category={account.category} />
                          </td>
                          <td className="px-4 py-2.5">
                            <AccountStatusBadge status={account.status} />
                          </td>
                          <td className="px-4 py-2.5">
                            <motion.button
                              type="button"
                              layout
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={busy}
                              aria-label={`Unmark ${label} as spare`}
                              onClick={() => unmark(account)}
                              className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy ? "Unmarking…" : "Unmark"}
                            </motion.button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
