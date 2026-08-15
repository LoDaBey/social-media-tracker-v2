"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/platform-config";
import { managerAccountToInput } from "@/lib/admin-account-input";
import { updateManagerSocialAccount } from "@/actions/manager-accounts";
import { AccountEditModal } from "@/components/admin/AccountEditModal";
import { AccountCategoryBadge } from "@/components/admin/AccountCategoryBadge";
import { AccountStatusBadge } from "@/components/admin/AccountStatusBadge";
import { AccountUrlCell } from "@/components/admin/AccountUrlCell";
import { ManagerAccountDeleteButton } from "@/components/manager/ManagerAccountDeleteButton";
import type { ManagerAccountRowProps } from "@/types/manager";

export function ManagerAccountRow({
  holderId,
  fullName,
  country,
  language,
  account,
  holderOptions,
}: ManagerAccountRowProps) {
  const [editOpen, setEditOpen] = useState(false);
  const displayName =
    account.account_name || account.username || account.account_url;

  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
        {PLATFORM_LABELS[account.platform]}
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {account.username || "—"}
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {account.account_email || "—"}
      </td>
      <td className="px-4 py-2.5 font-mono text-[13px] text-[var(--color-ink)]">
        {account.account_password || "—"}
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {language || "—"}
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
          <ManagerAccountDeleteButton
            accountId={account.id}
            accountName={displayName}
            holderName={fullName}
            country={country}
          />
        </div>
        <AccountEditModal
          open={editOpen}
          mode="edit"
          holderId={holderId}
          holderName={fullName}
          accountId={account.id}
          initial={managerAccountToInput(account, holderId, fullName)}
          holderOptions={holderOptions}
          onClose={() => setEditOpen(false)}
          save={(payload) => updateManagerSocialAccount(account.id, payload)}
        />
      </td>
    </tr>
  );
}
