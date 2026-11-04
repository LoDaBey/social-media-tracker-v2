import { CoverageLivePlatformCard } from "@/components/admin/CoverageLivePlatformCard";
import type { CoverageLivePlatformGridProps } from "@/types/admin";

const LEGEND = [
  { tone: "bg-[var(--color-emerald)]", label: "Personal" },
  { tone: "bg-[#4A8EC7]", label: "Umbrella" },
  { tone: "bg-[var(--color-gold)]", label: "Native" },
  { tone: "bg-[var(--color-coral)]", label: "Shortfall" },
] as const;

export function CoverageLivePlatformGrid({
  metrics,
  label = "Live coverage per platform",
  description,
  showHeader = true,
  embedded = false,
}: CoverageLivePlatformGridProps) {
  return (
    <section
      aria-label={label}
      className={
        embedded
          ? "flex min-w-0 flex-col gap-3"
          : "flex min-w-0 flex-col gap-3 rounded-[16px] bg-[var(--color-cream-tint)] p-3 sm:p-4"
      }
    >
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-semibold text-[var(--color-ink)]">
              {label}
            </h3>
            {description ? (
              <p className="mt-0.5 text-[12px] text-[var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <ul className="flex flex-wrap items-center gap-3" aria-label="Coverage legend">
            {LEGEND.map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]"
              >
                <span className={`h-2 w-2 rounded-sm ${item.tone}`} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <CoverageLivePlatformCard key={metric.key} metric={metric} />
        ))}
      </div>
    </section>
  );
}
