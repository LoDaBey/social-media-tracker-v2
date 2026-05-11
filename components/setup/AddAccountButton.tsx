"use client";

import { motion } from "framer-motion";
import { setupButtonMotion } from "@/lib/setup-motion";

type Props = {
  disabled?: boolean;
  onClick: () => void;
  ariaLabel: string;
};

export function AddAccountButton({ disabled, onClick, ariaLabel }: Props) {
  const isDisabled = Boolean(disabled);
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        "w-full",
        "h-12",
        "rounded-lg",
        "border border-dashed",
        "text-[14px] font-semibold",
        "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
        isDisabled
          ? "cursor-not-allowed border-[rgba(16,185,129,0.3)] text-[var(--color-emerald)] opacity-40"
          : "cursor-pointer border-[rgba(16,185,129,0.3)] text-[var(--color-emerald)] hover:bg-[var(--color-emerald-tint)]",
      ].join(" ")}
      style={{ fontFamily: "var(--font-cairo)", fontWeight: 600 }}
      {...setupButtonMotion(isDisabled)}
    >
      + Add account
    </motion.button>
  );
}

