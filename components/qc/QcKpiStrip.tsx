import type { QcKpis } from "@/types/qc";

type Tile = {
  label: string;
  value: string;
  tone: "ink" | "coral";
};

function formatRate(pct: number) {
  if (pct === 0) return "0%";
  if (Number.isInteger(pct)) return `${pct}%`;
  return `${pct.toFixed(1)}%`;
}

export function QcKpiStrip({ kpis }: { kpis: QcKpis }) {
  const tiles: Tile[] = [
    { label: "Pending", value: kpis.pendingCount.toLocaleString("en-US"), tone: "ink" },
    {
      label: "Reviewed today",
      value: kpis.reviewedTodayCount.toLocaleString("en-US"),
      tone: "ink",
    },
    {
      label: "Rejection rate",
      value: formatRate(kpis.rejectionRatePct),
      tone: kpis.rejectionRatePct > 15 ? "coral" : "ink",
    },
  ];

  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="group"
      aria-label="Quality review KPIs"
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]">
            {tile.label}
          </p>
          <p
            className={[
              "mt-1 text-[22px] font-extrabold leading-tight tabular-nums",
              tile.tone === "coral"
                ? "text-[var(--color-coral)]"
                : "text-[var(--color-ink)]",
            ].join(" ")}
          >
            {tile.value}
          </p>
        </div>
      ))}
    </div>
  );
}
