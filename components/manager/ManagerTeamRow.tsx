"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { CountryFlag } from "@/lib/country-icons";
import type { ManagerTeamRowProps } from "@/types/manager";

export function ManagerTeamRow({ row }: ManagerTeamRowProps) {
  const router = useRouter();
  const setupHref = `/manager/setup?employeeId=${row.id}`;
  const setupLabel = row.setupComplete
    ? `Review setup for ${row.full_name}`
    : `Set up accounts for ${row.full_name}`;

  return (
    <tr
      className="cursor-pointer border-b border-[var(--color-hairline)] odd:bg-[var(--color-cream-tint)] last:border-b-0 hover:bg-[var(--color-emerald-tint)]/40"
      onClick={() => router.push(setupHref)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CountryFlag country={row.country} className="h-5 w-7" />
          <span className="text-[14px] font-semibold text-[var(--color-ink)]">
            {row.country}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-[14px] font-semibold text-[var(--color-ink)]">
        <Link
          href={setupHref}
          aria-label={setupLabel}
          className="rounded-lg outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          onClick={(event) => event.stopPropagation()}
        >
          {row.full_name}
        </Link>
      </td>
      <td className="hidden px-4 py-3 text-[14px] text-[var(--color-muted)] sm:table-cell">
        {row.email}
      </td>
      <td className="px-4 py-3 text-[14px] tabular-nums text-[var(--color-ink)]">
        {row.targetAccountsSum}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.04em] ${
            row.setupComplete
              ? "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]"
              : "bg-[var(--color-coral-tint)] text-[var(--color-coral)]"
          }`}
        >
          {row.setupComplete ? "Complete" : "Needs setup"}
        </span>
      </td>
      <td className="px-4 py-3">
        <motion.div
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex"
        >
          <Link
            href={setupHref}
            aria-label={setupLabel}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Eye className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
          </Link>
        </motion.div>
      </td>
    </tr>
  );
}
