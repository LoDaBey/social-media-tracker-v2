"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { setAdminSocialAccountSpare } from "@/actions/admin-accounts";
import { spareAccountKey } from "@/lib/admin-spare";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { useEmployeeAccounts } from "@/hooks/useEmployeeAccounts";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type {
  AdminSocialAccountListItem,
  AdminSpareAccountListItem,
  SpareAccountsMarkPanelProps,
  SpareMarkHolderOption,
} from "@/types/admin";

function toSpareListItem(
  account: AdminSocialAccountListItem,
  holder: SpareMarkHolderOption
): AdminSpareAccountListItem {
  return {
    id: account.id,
    source: holder.source,
    platform: account.platform,
    username: account.username,
    account_name: account.account_name,
    account_url: account.account_url,
    category: account.category,
    status: account.status,
    handler_id: holder.id,
    handler_name: holder.full_name,
    country: holder.country,
    region: holder.region,
  };
}

export function SpareAccountsMarkPanel({
  holders,
  onSpareChange,
}: SpareAccountsMarkPanelProps) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected =
    holders.find(
      (holder) => spareAccountKey(holder.source, holder.id) === selectedKey
    ) ?? null;
  const { accounts, loading, error, reload } = useEmployeeAccounts(
    selected?.source ?? null,
    selected?.id ?? null
  );

  function toggleSpare(
    account: AdminSocialAccountListItem,
    holder: SpareMarkHolderOption
  ) {
    const label =
      account.username || account.account_name || account.account_url || "Account";
    const nextSpare = !account.is_spare;
    const rowKey = spareAccountKey(holder.source, account.id);
    setPendingKey(rowKey);
    startTransition(async () => {
      const result = await setAdminSocialAccountSpare(
        account.id,
        nextSpare,
        holder.source
      );
      setPendingKey(null);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      onSpareChange(toSpareListItem(account, holder), nextSpare);
      toast.success(
        nextSpare
          ? `${label} marked as spare.`
          : `${label} unmarked as spare.`
      );
      reload();
      router.refresh();
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-ink)]">
        Handler
        <select
          value={selectedKey}
          aria-label="Select handler to mark spare accounts"
          onChange={(event) => setSelectedKey(event.target.value)}
          className="h-11 cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <option value="">Select a handler…</option>
          {holders.map((holder) => (
            <option
              key={spareAccountKey(holder.source, holder.id)}
              value={spareAccountKey(holder.source, holder.id)}
            >
              {holder.full_name}
              {holder.country ? ` · ${holder.country}` : ""}
              {holder.source === "alphaa" ? " · ALPHAA" : ""}
            </option>
          ))}
        </select>
      </label>

      {!selected ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
          Pick a handler to mark or unmark their accounts as spare.
        </p>
      ) : loading ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
          Loading accounts…
        </p>
      ) : error ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
          {error}
        </p>
      ) : accounts.length === 0 ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-8 text-center text-[14px] text-[var(--color-muted)]">
          This person has no social accounts.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-[var(--color-hairline)]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
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
                  Status
                </th>
                <th scope="col" className="px-4 py-2">
                  Spare
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
                const rowKey = spareAccountKey(selected.source, account.id);
                const busy = pending && pendingKey === rowKey;
                return (
                  <tr
                    key={rowKey}
                    className="border-t border-[var(--color-hairline)]"
                  >
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                      {extractPlatformLabel(account.platform)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
                      {account.username || account.account_name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[13px]">
                      <AccountUrlCell
                        url={account.account_url}
                        label={label}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <AccountStatusBadge status={account.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
                      {account.is_spare ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2.5">
                      <motion.button
                        type="button"
                        layout
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={busy}
                        aria-label={
                          account.is_spare
                            ? `Unmark ${label} as spare`
                            : `Mark ${label} as spare`
                        }
                        onClick={() => toggleSpare(account, selected)}
                        className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy
                          ? account.is_spare
                            ? "Unmarking…"
                            : "Marking…"
                          : account.is_spare
                            ? "Unmark"
                            : "Mark spare"}
                      </motion.button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
