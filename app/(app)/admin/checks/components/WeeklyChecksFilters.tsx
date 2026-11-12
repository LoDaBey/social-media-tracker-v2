"use client";

import { Search } from "lucide-react";
import { useInstantSearchParams } from "@/hooks/useInstantSearchParams";
import type {
  AdminWeeklyChecksFiltersProps,
  WeeklyCheckFilter,
} from "@/types/weekly-checks";

const FILTERS: { value: WeeklyCheckFilter; label: string }[] = [
  { value: "unchecked", label: "Not checked yet" },
  { value: "issue", label: "Problems reported" },
  { value: "changed", label: "Changed that day" },
  { value: "ok", label: "Checked OK" },
  { value: "all", label: "All accounts" },
];

const selectClass =
  "h-10 cursor-pointer rounded-lg outline-none border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-[14px] font-medium text-[var(--color-ink)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

export function WeeklyChecksFilters({
  filter: serverFilter,
  country: serverCountry,
  q,
  countries,
}: AdminWeeklyChecksFiltersProps) {
  const { params, update, isPending } = useInstantSearchParams();
  const filter =
    params.get("filter") ?? (isPending ? "unchecked" : serverFilter);
  const country = params.get("country") ?? (isPending ? "" : serverCountry);

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        update({ q: String(form.get("q") ?? "").trim() || null });
      }}
    >
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">
          Search holder, account or Country Manager
        </span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
          aria-hidden="true"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search holder, account or Country Manager"
          className="h-10 w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] pl-9 pr-3 text-[14px] text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        />
      </label>
      <select
        value={filter}
        aria-label="Show accounts"
        onChange={(event) =>
          update({
            filter:
              event.target.value === "unchecked" ? null : event.target.value,
          })
        }
        className={selectClass}
      >
        {FILTERS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <select
        value={country}
        aria-label="Country"
        onChange={(event) => update({ country: event.target.value || null })}
        className={selectClass}
      >
        <option value="">All countries</option>
        {countries.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </form>
  );
}
