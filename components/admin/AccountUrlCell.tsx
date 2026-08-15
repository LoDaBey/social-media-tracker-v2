import type { AccountUrlCellProps } from "@/types/admin";

export function AccountUrlCell({ url, label }: AccountUrlCellProps) {
  if (!url) {
    return (
      <span className="text-[13px] text-[var(--color-muted)]" aria-label={`${label} has no profile URL yet`}>
        —
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={url}
      aria-label={`Open ${label} profile`}
      className="block max-w-[180px] truncate rounded-lg text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
    >
      {url}
    </a>
  );
}
