"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useInstantSearchParams } from "@/hooks/useInstantSearchParams";
import {
  PLATFORM_LABELS,
  type Platform,
} from "@/lib/platform-config";
import type { QcStatusGroup } from "@/types/qc";

type PlatformChip = { id: "all" | Platform; label: string };

const PLATFORM_CHIPS: PlatformChip[] = [
  { id: "all", label: "All" },
  { id: "x", label: PLATFORM_LABELS.x },
  { id: "facebook_personal", label: "Facebook" },
  { id: "instagram", label: PLATFORM_LABELS.instagram },
  { id: "tiktok", label: PLATFORM_LABELS.tiktok },
];

const STATUS_CHIPS: { id: QcStatusGroup; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export function QcQueueFilters() {
  const { params, update } = useInstantSearchParams();
  // The search box syncs from the real URL (back / forward), not the instant copy.
  const initialQ = useSearchParams().get("q") ?? "";
  const activePlatform = (params.get("platform") ?? "all") as PlatformChip["id"];
  const activeStatus = (params.get("status") ?? "pending") as QcStatusGroup;

  const [lastInitialQ, setLastInitialQ] = useState(initialQ);
  const [draftQ, setDraftQ] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (lastInitialQ !== initialQ) {
    setLastInitialQ(initialQ);
    setDraftQ(initialQ);
  }

  function pushPatch(patch: Record<string, string | null>) {
    // Changing a filter closes the open item, as before.
    update({ ...patch, selected: null });
  }

  function onChangeSearch(value: string) {
    setDraftQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushPatch({ q: value.trim() ? value.trim() : null });
    }, 350);
  }

  function onSubmitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushPatch({ q: draftQ.trim() ? draftQ.trim() : null });
  }

  function onSelectPlatform(id: PlatformChip["id"]) {
    pushPatch({ platform: id === "all" ? null : id });
  }

  function onSelectStatus(id: QcStatusGroup) {
    pushPatch({ status: id });
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSubmitSearch} role="search">
        <label htmlFor="qc-search" className="sr-only">
          Search the review queue
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden="true"
          />
          <input
            id="qc-search"
            type="search"
            inputMode="search"
            value={draftQ}
            onChange={(event) => onChangeSearch(event.target.value)}
            placeholder="Search by employee or account..."
            aria-label="Search by employee or account"
            className="h-11 w-full rounded-[12px] border border-[var(--color-hairline)] bg-[var(--color-surface)] pl-10 pr-3 text-[14px] font-medium text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          />
        </div>
      </form>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Platform filters"
      >
        {PLATFORM_CHIPS.map((chip) => {
          const active = activePlatform === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-label={`Filter by ${chip.label}`}
              aria-pressed={active}
              onClick={() => onSelectPlatform(chip.id)}
              className={[
                "cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                active
                  ? "bg-[var(--color-emerald)] text-white"
                  : "border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-cream-tint)]",
              ].join(" ")}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Status filters"
      >
        {STATUS_CHIPS.map((chip) => {
          const active = activeStatus === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-label={`Filter by ${chip.label}`}
              aria-pressed={active}
              onClick={() => onSelectStatus(chip.id)}
              className={[
                "cursor-pointer rounded-full px-3 py-1.5 text-[12px] font-semibold outline-none",
                "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                active
                  ? "bg-[var(--color-emerald)] text-white"
                  : "border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-cream-tint)]",
              ].join(" ")}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
