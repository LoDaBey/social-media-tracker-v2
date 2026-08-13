"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { setupButtonMotion } from "@/lib/setup-motion";
import type { SetupCancelButtonProps } from "@/types/setup";

export function SetupCancelButton({ disabled }: SetupCancelButtonProps) {
  const router = useRouter();
  const isDisabled = Boolean(disabled);

  return (
    <motion.button
      type="button"
      aria-label="Cancel and go back to dashboard"
      disabled={isDisabled}
      onClick={() => router.push("/dashboard")}
      layout
      className={[
        "cursor-pointer rounded-lg",
        "h-9 px-3 sm:h-10 sm:px-5",
        "bg-[var(--color-coral)] text-white",
        "font-[var(--font-cairo)] font-bold text-[13px] sm:text-[14px]",
        "transition-opacity",
        "hover:opacity-90",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]",
      ].join(" ")}
      {...setupButtonMotion(isDisabled)}
    >
      Cancel
    </motion.button>
  );
}
