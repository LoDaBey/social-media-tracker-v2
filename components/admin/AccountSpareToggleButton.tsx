"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";
import { setAdminSocialAccountSpare } from "@/actions/admin-accounts";
import type { AccountSpareToggleButtonProps } from "@/types/admin";

export function AccountSpareToggleButton({
  accountId,
  accountName,
  isSpare,
  onChanged,
}: AccountSpareToggleButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const nextSpare = !isSpare;
      const result = await setAdminSocialAccountSpare(accountId, nextSpare);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        nextSpare
          ? `${accountName} marked as spare.`
          : `${accountName} unmarked as spare.`
      );
      onChanged?.();
      router.refresh();
    });
  }

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={pending}
        aria-label={
          isSpare
            ? `Unmark ${accountName} as spare`
            : `Mark ${accountName} as spare`
        }
        title={isSpare ? "Unmark as spare" : "Mark as spare"}
        onClick={toggle}
        className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-50 ${
          isSpare
            ? "bg-[var(--color-gold)]/20 text-[var(--color-ink)] hover:bg-[var(--color-gold)]/30"
            : "text-[var(--color-muted)] hover:bg-[var(--color-cream-tint)] hover:text-[var(--color-ink)]"
        }`}
      >
        {isSpare ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
        ) : (
          <Bookmark className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
        )}
      </button>
    </motion.div>
  );
}
