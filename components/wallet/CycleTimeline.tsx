import type { CSSProperties } from "react";
import type { WalletDailyGrowthStatus } from "@/types/wallet";
import { addDaysToIsoDate, compareIsoDates, formatShortDate, getCycleDayOf30 } from "@/lib/cairo-date";

type SegmentStatus = "submitted" | "reset" | "future" | "gap";

type Props = {
  cycleStart: string | null;
  todayCairo: string;
  daily: WalletDailyGrowthStatus[];
  /** Pre-formatted label for cycle end (matches wallet cycle end). */
  cycleEndLabel: string | null;
};

function segmentStyle(status: SegmentStatus, isToday: boolean): CSSProperties {
  const ring = isToday ? "0 0 0 2px var(--color-ink)" : "none";
  switch (status) {
    case "submitted":
      return { backgroundColor: "#0E6B4F", boxShadow: ring };
    case "reset":
      return { backgroundColor: "#D85B47", boxShadow: ring };
    case "future":
      return {
        backgroundColor: "var(--color-cream-tint)",
        border: "1px solid var(--color-hairline)",
        boxShadow: ring,
      };
    case "gap":
    default:
      return { backgroundColor: "#FAF8F2", boxShadow: ring };
  }
}

export function CycleTimeline({ cycleStart, todayCairo, daily, cycleEndLabel }: Props) {
  const byDate = new Map(daily.map((d) => [d.submission_date.slice(0, 10), d]));
  const dayN = getCycleDayOf30(cycleStart, todayCairo);

  const segments: { status: SegmentStatus; isToday: boolean }[] = [];
  for (let i = 0; i < 30; i += 1) {
    const date = cycleStart ? addDaysToIsoDate(cycleStart.slice(0, 10), i) : "";
    const isToday = Boolean(date && date === todayCairo);
    let status: SegmentStatus = "gap";
    if (!cycleStart || !date) {
      status = "gap";
    } else if (compareIsoDates(date, todayCairo) > 0) {
      status = "future";
    } else {
      const row = byDate.get(date);
      if (row?.has_approved) status = "submitted";
      else if (row?.has_reset) status = "reset";
      else status = "gap";
    }
    segments.push({ status, isToday });
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-[960px]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Cycle progress · Day {dayN} of 30
        </p>
        <div className="text-right text-[12px] font-normal text-[var(--color-muted)]">
          {cycleStart ? (
            <>
              <span>Started {formatShortDate(cycleStart)}</span>
              <span className="mx-1.5 opacity-50">·</span>
              <span>Ends {cycleEndLabel ?? "—"}</span>
            </>
          ) : (
            <span>No active cycle</span>
          )}
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-1"
        style={{ gap: "4px" }}
        role="list"
        aria-label="30-day cycle progress"
      >
        {segments.map((seg, i) => (
          <div
            key={i}
            role="listitem"
            className="h-2 rounded-full"
            style={{ width: 18, ...segmentStyle(seg.status, seg.isToday) }}
            title={`Day ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
