"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { createManagerSocialAccount } from "@/actions/manager-accounts";
import { emptyAdminSocialAccountInput } from "@/lib/admin-account-input";
import { AccountEditModal } from "@/components/admin/AccountEditModal";
import type { ManagerAddAccountButtonProps } from "@/types/manager";

export function ManagerAddAccountButton({
  holderId,
  fullName,
  holderOptions,
}: ManagerAddAccountButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          type="button"
          aria-label={`Add account for ${fullName}`}
          onClick={() => setOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-emerald)] px-3 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
          Add account
        </button>
      </motion.div>
      <AccountEditModal
        open={open}
        mode="create"
        holderId={holderId}
        holderName={fullName}
        initial={emptyAdminSocialAccountInput(fullName)}
        holderOptions={holderOptions}
        onClose={() => setOpen(false)}
        save={(payload) => createManagerSocialAccount(holderId, payload)}
      />
    </>
  );
}
