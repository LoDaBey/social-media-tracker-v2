"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { SETUP_CATEGORIES, isSetupCategory } from "@/lib/setup-options";
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/platform-config";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
} from "@/lib/setup-schema";
import { bulkImportRowWarnings } from "@/lib/bulk-import-parse";
import type { BulkImportReviewRowProps } from "@/types/admin";

const fieldClass =
  "w-full min-w-[140px] rounded outline-none border bg-white px-2.5 py-2 text-[13px] font-medium text-[var(--color-ink)]";
const okClass =
  "border-[var(--color-hairline)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";
const warnClass = "border-[#E08A2C] focus-visible:ring-2 focus-visible:ring-[#E08A2C]";

export function BulkImportReviewRow({
  row,
  onChange,
  onRemove,
}: BulkImportReviewRowProps) {
  const warnings = bulkImportRowWarnings(row);
  const urlInvalid = Boolean(
    row.url.trim() &&
      (!isValidAccountUrl(row.url) ||
        (row.platform && !isPlatformAccountUrl(row.platform, row.url)))
  );
  const emailInvalid = Boolean(row.email.trim() && !isValidAccountEmail(row.email));
  const categoryInvalid = Boolean(
    row.category.trim() && !isSetupCategory(row.category.trim())
  );
  const platformInvalid = !row.platform;

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
            className={`cursor-pointer ${fieldClass} ${platformInvalid ? warnClass : okClass}`}
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
            className={`${fieldClass} ${okClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.email}
            aria-label="Email"
            onChange={(event) => onChange({ email: event.target.value })}
            className={`${fieldClass} ${emailInvalid ? warnClass : okClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.accountPassword}
            aria-label="Account password"
            autoComplete="off"
            onChange={(event) => onChange({ accountPassword: event.target.value })}
            className={`${fieldClass} ${okClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.emailPassword}
            aria-label="Email password"
            autoComplete="off"
            onChange={(event) => onChange({ emailPassword: event.target.value })}
            className={`${fieldClass} ${okClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={row.url}
            aria-label="Profile URL"
            onChange={(event) => onChange({ url: event.target.value })}
            className={`min-w-[220px] ${fieldClass} ${urlInvalid ? warnClass : okClass}`}
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={row.category}
            aria-label="Category"
            onChange={(event) => onChange({ category: event.target.value })}
            className={`cursor-pointer ${fieldClass} ${categoryInvalid ? warnClass : okClass}`}
          >
            <option value="">Select</option>
            {categoryInvalid ? (
              <option value={row.category}>{row.category} (invalid)</option>
            ) : null}
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
            className={`cursor-pointer ${fieldClass} ${okClass}`}
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
            className={`${fieldClass} ${okClass}`}
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
      {warnings.length > 0 ? (
        <tr>
          <td
            colSpan={10}
            className="px-3 pb-2 text-[12px] font-semibold text-[#E08A2C]"
          >
            {warnings.join(" ")}
          </td>
        </tr>
      ) : null}
    </>
  );
}
