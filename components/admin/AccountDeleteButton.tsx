"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteAdminSocialAccount } from "@/actions/admin-accounts";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AccountDeleteButtonProps } from "@/types/admin";

export function AccountDeleteButton({
  accountId,
  accountName,
  onDeleted,
}: AccountDeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteAdminSocialAccount(accountId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${accountName} was deleted.`);
      setOpen(false);
      onDeleted?.();
      router.refresh();
    });
  }

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Delete ${accountName}`}
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-coral)] outline-none hover:bg-[var(--color-coral-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
        </button>
      </motion.div>
      <ConfirmDialog
        open={open}
        title="Delete this account?"
        description={`You're going to delete ${accountName}? Submissions tied to it will also be removed.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={confirm}
      />
    </>
  );
}
