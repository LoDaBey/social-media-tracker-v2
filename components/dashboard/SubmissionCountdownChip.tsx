"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

type Props = {
  initialMs: number;
};

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / ONE_MINUTE_MS);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function SubmissionCountdownChip({ initialMs }: Props) {
  const [remainingMs, setRemainingMs] = useState(initialMs);
  const isUrgent = remainingMs < THREE_HOURS_MS;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemainingMs((current) => Math.max(0, current - ONE_MINUTE_MS));
    }, ONE_MINUTE_MS);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside
      className={[
        "flex items-center gap-3 border border-[var(--color-hairline)] px-4 py-3",
        isUrgent ? "bg-[var(--color-coral-tint)]" : "bg-[var(--color-surface)]",
      ].join(" ")}
      style={{ borderRadius: 14 }}
      aria-label="Submission window countdown"
    >
      <Clock3
        className={[
          "h-5 w-5",
          isUrgent ? "text-[var(--color-coral)]" : "text-[var(--color-muted)]",
        ].join(" ")}
        aria-hidden="true"
      />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Submission Window Closes In
        </p>
        <p
          className={[
            "mt-0.5 text-[22px] font-bold leading-none tabular-nums",
            isUrgent ? "text-[var(--color-coral)]" : "text-[var(--color-ink)]",
          ].join(" ")}
        >
          {formatRemaining(remainingMs)}
        </p>
      </div>
    </aside>
  );
}
