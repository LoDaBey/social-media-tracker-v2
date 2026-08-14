"use client";

import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { SignOutOverlay } from "@/components/layout/SignOutOverlay";

export function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <SignOutOverlay visible={pending} />
      <motion.button
        type="submit"
        aria-label={pending ? "Signing out" : "Sign out"}
        aria-busy={pending}
        disabled={pending}
        layout
        whileHover={pending ? undefined : { scale: 1.05 }}
        whileTap={pending ? undefined : { scale: 0.95 }}
        className={[
          "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-[var(--color-ink)]",
          "hover:bg-[var(--color-cream-tint)]",
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
          "disabled:cursor-wait disabled:opacity-70",
        ].join(" ")}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing out…
          </>
        ) : (
          "Sign out"
        )}
      </motion.button>
    </>
  );
}
