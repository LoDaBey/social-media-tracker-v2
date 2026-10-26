"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { adminSocialAccountToInput } from "@/lib/admin-account-input";
import { AccountDeleteButton } from "@/components/admin/AccountDeleteButton";
import { AccountEditModal } from "@/components/admin/AccountEditModal";
import { AccountCategoryBadge } from "@/components/admin/AccountCategoryBadge";
import { AccountSpareBadge } from "@/components/admin/AccountSpareBadge";
import { AccountSpareToggleButton } from "@/components/admin/AccountSpareToggleButton";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type { AccountRowProps } from "@/types/admin";

export function AccountRow({
  holderId,
  holderName,
  account,
  canMarkSpare = false,
  onChanged,
  readOnly = false,
}: AccountRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const displayName =
    account.account_name || account.username || account.account_url || "Account";

  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
        <div className="flex flex-wrap items-center gap-2">
          <span>{extractPlatformLabel(account.platform)}</span>
          <AccountSpareBadge isSpare={account.is_spare} />
        </div>
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {account.username || "—"}
      </td>
      <td className="px-4 py-2.5 text-[13px]">
        <AccountUrlCell url={account.account_url} label={displayName} />
      </td>
      <td className="px-4 py-2.5">
        <AccountCategoryBadge category={account.category} />
      </td>
      <td className="px-4 py-2.5">
        <AccountStatusBadge status={account.status} />
      </td>
      <td className="px-4 py-2.5">
        {readOnly ? (
          <span className="text-[13px] text-[var(--color-muted)]">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {canMarkSpare ? (
              <AccountSpareToggleButton
                accountId={account.id}
                accountName={displayName}
                isSpare={account.is_spare}
                onChanged={onChanged}
              />
            ) : null}
            <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                type="button"
                aria-label={`Edit ${displayName}`}
                onClick={() => setEditOpen(true)}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
              </button>
            </motion.div>
            <AccountDeleteButton
              accountId={account.id}
              accountName={displayName}
              onDeleted={onChanged}
            />
          </div>
        )}
        {readOnly ? null : (
          <AccountEditModal
            open={editOpen}
            mode="edit"
            holderId={holderId}
            holderName={holderName}
            accountId={account.id}
            initial={adminSocialAccountToInput(account)}
            onClose={() => setEditOpen(false)}
            onSaved={onChanged}
          />
        )}
      </td>
    </tr>
  );
}
