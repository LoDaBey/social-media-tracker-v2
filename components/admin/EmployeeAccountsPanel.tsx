"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { emptyAdminSocialAccountInput } from "@/lib/admin-account-input";
import { AccountEditModal } from "@/components/admin/AccountEditModal";
import { EmployeeAccountsTable } from "@/components/admin/EmployeeAccountsTable";
import type { EmployeeAccountsPanelProps } from "@/types/admin";

export function EmployeeAccountsPanel({
  userId,
  fullName,
  accounts,
  assignedCount,
  canAdd,
  onChanged,
}: EmployeeAccountsPanelProps) {
  const [addOpen, setAddOpen] = useState(false);
  const total = accounts.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-[var(--color-muted)]">
          {assignedCount > 0
            ? `${total} of ${assignedCount} assigned accounts`
            : `${total} ${total === 1 ? "account" : "accounts"}`}
        </p>
        {canAdd ? (
          <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              aria-label={`Add account for ${fullName}`}
              onClick={() => setAddOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-emerald)] px-3 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
              Add account
            </button>
          </motion.div>
        ) : null}
      </div>

      {accounts.length === 0 ? (
        <p className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-6 text-center text-[14px] text-[var(--color-muted)]">
          No social accounts have been added for {fullName} yet.
        </p>
      ) : (
        <EmployeeAccountsTable
          userId={userId}
          fullName={fullName}
          accounts={accounts}
          onChanged={onChanged}
        />
      )}

      <AccountEditModal
        open={addOpen}
        mode="create"
        holderId={userId}
        holderName={fullName}
        initial={emptyAdminSocialAccountInput(fullName)}
        onClose={() => setAddOpen(false)}
        onSaved={onChanged}
      />
    </div>
  );
}
