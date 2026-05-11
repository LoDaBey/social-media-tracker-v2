import { Star } from "lucide-react";
import { LEVEL_LABELS, LEVEL_SALARY_PERCENT } from "@/lib/level-labels";

export function getLevelCaption(level: number) {
  const nextLevel = Math.min(6, level + 1);

  if (level >= 6) {
    return {
      prefix: "You've unlocked the top level ",
      emphasis: "(+5% salary)",
      suffix: ".",
    };
  }

  const nextLabel = LEVEL_LABELS[nextLevel] ?? "the next level";
  const nextPercent = LEVEL_SALARY_PERCENT[nextLevel] ?? "0%";
  const engagementTarget = nextPercent.replace("+", "");

  return {
    prefix: `Reach ${engagementTarget} engagement to unlock ${nextLabel} `,
    emphasis: `(${nextPercent} salary)`,
    suffix: "",
  };
}

type Props = {
  level: number;
};

export function LevelCard({ level }: Props) {
  const caption = getLevelCaption(level);

  return (
    <section
      className="bg-[var(--color-surface)] border border-[var(--color-hairline)] p-7 md:basis-[40%]"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "0 1px 2px rgba(20,20,20,.04), 0 12px 32px rgba(20,20,20,.05)",
      }}
      aria-label="Level summary"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
        Your Level
      </p>

      <div className="mt-4 flex items-center gap-3">
        <h2 className="text-[24px] font-extrabold leading-tight text-[var(--color-ink)]">
          {LEVEL_LABELS[level] ?? "Accepted"} · Level {level}
        </h2>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
          aria-label="Level badge"
        >
          <Star className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-3 flex gap-1.5" aria-label={`${level} of 6 level segments filled`}>
        {[1, 2, 3, 4, 5, 6].map((segment) => (
          <span
            key={segment}
            className={[
              "h-3 flex-1 rounded-[4px]",
              segment <= level
                ? "bg-[var(--color-emerald)]"
                : "border border-[var(--color-hairline)] bg-[var(--color-cream-tint)]",
            ].join(" ")}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="mt-4 text-[13px] font-normal leading-6 text-[var(--color-muted)]">
        {caption.prefix}
        <strong className="font-bold text-[var(--color-ink)]">{caption.emphasis}</strong>
        {caption.suffix}
      </p>
    </section>
  );
}
