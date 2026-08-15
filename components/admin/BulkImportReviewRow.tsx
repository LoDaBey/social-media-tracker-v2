"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { SETUP_CATEGORIES } from "@/lib/setup-options";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/platform-config";
import type { BulkImportReviewRowProps } from "@/types/admin";

const fieldClass =
  "w-full min-w-[140px] rounded outline-none border border-[var(--color-hairline)] bg-white px-2.5 py-2 text-[13px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function BulkImportReviewRow({
  row,
  error,
  onChange,
  onRemove,
}: BulkImportReviewRowProps) {
  return (
    <>
      <tr className="border-t border-[var(--color-hairline)] align-top">
        <td className="px-3 py-2">
          <select
            value={row.platform}
            aria-label="Platform"
            onChange={(event) =>
              onChange({
                platform: event.target.value as BulkImportReviewRowProps["row"]["platform"],
              })
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="">Select</option>
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            value={row.username}
            aria-label="Username"
            onChange={(event) => onChange({ username: event.target.value })}
            className={fieldClass}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.email}
            aria-label="Email"
            onChange={(event) => onChange({ email: event.target.value })}
            className={fieldClass}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.accountPassword}
            aria-label="Account password"
            autoComplete="off"
            onChange={(event) => onChange({ accountPassword: event.target.value })}
            className={fieldClass}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.emailPassword}
            aria-label="Email password"
            autoComplete="off"
            onChange={(event) => onChange({ emailPassword: event.target.value })}
            className={fieldClass}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.url}
            aria-label="Profile URL"
            onChange={(event) => onChange({ url: event.target.value })}
            className={`min-w-[220px] ${fieldClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={row.category}
            aria-label="Category"
            onChange={(event) => onChange({ category: event.target.value })}
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="">Select</option>
            {SETUP_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select
            value={row.status}
            aria-label="Status"
            onChange={(event) =>
              onChange({
                status: event.target
                  .value as BulkImportReviewRowProps["row"]["status"],
              })
            }
            className={`cursor-pointer ${fieldClass}`}
          >
            <option value="active">Active</option>
            <option value="archived">Temp locked</option>
            <option value="suspended">Suspended</option>
          </select>
        </td>
        <td className="px-3 py-2">
          <input
            value={row.mobileNumber}
            aria-label="Mobile number"
            onChange={(event) => onChange({ mobileNumber: event.target.value })}
            className={fieldClass}
          />
        </td>
        <td className="px-3 py-2">
          <motion.div layout whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              type="button"
              aria-label="Remove this account row"
              onClick={onRemove}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-coral)] outline-none hover:bg-[var(--color-coral-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        </td>
      </tr>
      {error ? (
        <tr>
          <td
            colSpan={10}
            className="px-3 pb-2 text-[12px] font-semibold text-[var(--color-coral)]"
          >
            {error}
          </td>
        </tr>
      ) : null}
    </>
  );
}
