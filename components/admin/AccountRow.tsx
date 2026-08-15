"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { adminSocialAccountToInput } from "@/lib/admin-account-input";
import { AccountDeleteButton } from "@/components/admin/AccountDeleteButton";
import { AccountEditModal } from "@/components/admin/AccountEditModal";
import { AccountCategoryBadge } from "@/components/admin/AccountCategoryBadge";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import type { AccountRowProps } from "@/types/admin";

export function AccountRow({
  holderId,
  holderName,
  account,
  onChanged,
}: AccountRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const displayName =
    account.account_name || account.username || account.account_url || "Account";

  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
        {PLATFORM_LABELS[account.platform]}
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
        <div className="flex items-center gap-1.5">
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
      </td>
    </tr>
  );
}
