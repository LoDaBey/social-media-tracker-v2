"use client";

import { motion } from "framer-motion";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { spareAccountKey } from "@/lib/admin-spare";
import { AccountCategoryBadge } from "@/components/admin/AccountCategoryBadge";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type { SpareAccountsListProps } from "@/types/admin";

export function SpareAccountsList({
  accounts,
  pendingKey,
  pending,
  onUnmark,
  emptyMessage,
}: SpareAccountsListProps) {
  if (accounts.length === 0) {
    return (
      <p className="mt-6 rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
        {emptyMessage ??
          "No spare accounts right now. Use Mark spare to add one."}
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-[16px] border border-[var(--color-hairline)]">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <th scope="col" className="px-4 py-2">
              Handler
            </th>
            <th scope="col" className="px-4 py-2">
              Project
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
            const rowKey = spareAccountKey(account.source, account.id);
            const busy = pending && pendingKey === rowKey;
            return (
              <tr
                key={rowKey}
                className="border-t border-[var(--color-hairline)]"
              >
                <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
                  {account.handler_name}
                  <span className="mt-0.5 block text-[11px] font-medium text-[var(--color-muted)]">
                    {account.source === "alphaa" ? "ALPHAA" : "Africa / Europe"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                  {account.country ||
                    account.projects[0] ||
                    "—"}
                  {account.projects.length > 1 ? (
                    <span className="block text-[11px] text-[var(--color-muted)]">
                      {account.projects.join(", ")}
                    </span>
                  ) : account.region ? (
                    <span className="block text-[11px] text-[var(--color-muted)]">
                      {account.region}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                  {extractPlatformLabel(account.platform)}
                </td>
                <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                  {account.username || "—"}
                </td>
                <td className="px-4 py-2.5 text-[13px]">
                  <AccountUrlCell url={account.account_url} label={label} />
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
                    onClick={() => onUnmark(account)}
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
  );
}
