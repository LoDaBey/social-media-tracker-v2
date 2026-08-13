"use client";

import { motion } from "framer-motion";
import type { SetupStepNavProps } from "@/types/setup";

export function SetupStepNav({ steps, currentIndex }: SetupStepNavProps) {
  const current = steps[currentIndex];
  if (!current) return null;

  return (
    <div className="w-full" aria-label="Setup steps">
      <p
        className="text-center text-[13px] font-semibold text-[var(--color-ink)]"
        style={{ fontFamily: "var(--font-cairo)" }}
      >
        Step {currentIndex + 1} of {steps.length}
        <span className="text-[var(--color-muted)]"> · {current.label}</span>
      </p>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <motion.span
              key={step.id}
              layout
              aria-hidden="true"
              className={[
                "h-1.5 rounded-full transition-colors",
                isCurrent
                  ? "w-6 bg-[var(--color-emerald)]"
                  : isDone
                    ? "w-3 bg-[var(--color-emerald)]/50"
                    : "w-3 bg-[var(--color-hairline)]",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}
