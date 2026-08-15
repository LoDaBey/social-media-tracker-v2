"use client";

import { PLATFORM_LABELS } from "@/lib/platform-config";
import type { ManagerAccountRowProps } from "@/types/manager";

export function ManagerAccountRow({ account }: ManagerAccountRowProps) {
  const displayName =
    account.account_name || account.username || account.account_url;

  return (
    <tr className="border-t border-[var(--color-hairline)]">
      <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--color-ink)]">
        {PLATFORM_LABELS[account.platform]}
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {account.username || "—"}
      </td>
      <td className="px-4 py-2.5 text-[13px]">
        <a
          href={account.account_url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${displayName} profile`}
          className="rounded-lg text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          {account.account_url}
        </a>
      </td>
      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink)]">
        {account.category || "—"}
      </td>
      <td className="px-4 py-2.5 text-[13px] capitalize text-[var(--color-ink)]">
        {account.status}
      </td>
    </tr>
  );
}
