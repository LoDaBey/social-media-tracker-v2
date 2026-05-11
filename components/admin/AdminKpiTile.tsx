type Props = {
  title: string;
  value: string;
  subtitle?: string;
};

export function AdminKpiTile({ title, value, subtitle }: Props) {
  return (
    <div
      className="rounded-[16px] bg-[var(--color-surface)] px-6 py-5"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <p className="text-[13px] font-medium text-[var(--color-muted)]">{title}</p>
      <p className="mt-2 text-[28px] font-extrabold tabular-nums text-[var(--color-ink)]">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-1 text-[12px] text-[var(--color-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}
