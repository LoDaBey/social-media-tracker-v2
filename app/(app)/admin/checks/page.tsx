import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { requireAdminPageAccess } from "@/lib/admin-access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewChecks } from "@/lib/admin-view";
import { formatShortDate } from "@/lib/cairo-date";
import {
  fetchAdminWeeklyChecks,
  parseWeeklyCheckFilter,
} from "@/lib/weekly-checks-data";
import { WeeklyChecksFilters } from "./components/WeeklyChecksFilters";
import { WeeklyChecksTable } from "./components/WeeklyChecksTable";
import { WeeklyChecksProblemsCard } from "./components/WeeklyChecksProblemsCard";

export const metadata: Metadata = {
  title: "Daily checks",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default async function AdminWeeklyChecksPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const viewer = await requireAdminPageAccess("checks");
  const params = (await searchParams) ?? {};
  const filters = {
    filter: parseWeeklyCheckFilter(firstParam(params.filter)),
    country: firstParam(params.country) ?? "",
    q: firstParam(params.q) ?? "",
    date: firstParam(params.date) ?? "",
    // From an OP notification: only this Country Manager's team.
    managerId: Number(firstParam(params.manager)) || null,
  };

  let data;
  try {
    data = await fetchAdminWeeklyChecks(
      filters,
      viewer.role === "op" ? viewer.scope : null,
    );
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <AdminWorkspace view={adminViewChecks()}>
        <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[14px] text-[var(--color-muted)]">
          Daily checks need the database update first (migrations 0026 and
          0027).
        </p>
      </AdminWorkspace>
    );
  }

  const { kpis } = data;
  const checked = kpis.ok + kpis.issue;
  const cards = [
    {
      label: "Accounts to check",
      value: kpis.total,
      tone: "ink",
      hint: "",
    },
    {
      label: "Checked",
      value: checked,
      tone: "emerald",
      hint: `${percent(checked, kpis.total)}%`,
    },
    {
      label: "Not checked yet",
      value: kpis.unchecked,
      tone: "amber",
      hint: "",
    },
    {
      label: "Problems reported",
      value: kpis.issue,
      tone: "coral",
      hint: "",
    },
    {
      label: data.isToday ? "Changed today" : "Changed that day",
      value: kpis.changed,
      tone: "ink",
      hint: "",
    },
  ] as const;
  const toneClass = {
    ink: "text-[var(--color-ink)]",
    emerald: "text-[var(--color-emerald)]",
    amber: "text-[var(--color-amber)]",
    coral: "text-[var(--color-coral)]",
  };

  return (
    <AdminWorkspace view={adminViewChecks()}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-cream-tint)] px-3 py-1 text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
            {data.isToday ? "Today" : formatShortDate(data.date)}
          </span>
          {data.manager ? (
            <Link
              href={
                data.isToday
                  ? "/admin/checks"
                  : `/admin/checks?date=${data.date}`
              }
              aria-label={`Show all Country Managers instead of ${data.manager.name}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-emerald-tint)] px-3 py-1 text-[13px] font-semibold text-[var(--color-emerald)] outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              {data.manager.name}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : null}
          {!data.isToday ? (
            <Link
              href={
                data.manager
                  ? `/admin/checks?manager=${data.manager.id}`
                  : "/admin/checks"
              }
              className="rounded-full border border-[var(--color-hairline)] px-3 py-1 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
            >
              Today
            </Link>
          ) : null}
        </div>

        <section
          aria-label="Weekly check totals"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {cards.map((card) =>
            card.label === "Problems reported" ? (
              <WeeklyChecksProblemsCard
                key={card.label}
                count={card.value}
                problems={data.problems}
              />
            ) : (
              <div
                key={card.label}
                className="flex flex-col gap-1 rounded-[16px] bg-[var(--color-surface)] px-4 py-4"
                style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
                aria-label={`${card.label}: ${card.value}`}
              >
                <p className="text-[12px] font-semibold text-[var(--color-muted)]">
                  {card.label}
                </p>
                <p
                  className={`text-[26px] font-extrabold tabular-nums leading-none ${toneClass[card.tone]}`}
                >
                  {card.value}
                </p>
                {card.hint ? (
                  <p className="text-[11px] font-semibold tabular-nums text-[var(--color-muted)]">
                    {card.hint}
                  </p>
                ) : null}
              </div>
            ),
          )}
        </section>

        {!data.manager && data.managers.length > 0 ? (
          <section
            aria-label="Progress by Country Manager"
            className="flex flex-col gap-2"
          >
            <h2 className="text-[13px] font-semibold text-[var(--color-ink)]">
              Progress by Country Manager
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {data.managers.map((manager) => {
                const done = percent(manager.checked, manager.total);
                return (
                  <Link
                    key={manager.managerId ?? "none"}
                    href={
                      manager.managerId
                        ? `/admin/checks?manager=${manager.managerId}${data.isToday ? "" : `&date=${data.date}`}`
                        : "#"
                    }
                    aria-label={`Show ${manager.managerName}'s team`}
                    className="flex flex-col gap-1.5 rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2.5 outline-none hover:border-[var(--color-emerald)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  >
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate font-semibold text-[var(--color-ink)]">
                        {manager.managerName}
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--color-muted)]">
                        {manager.checked} / {manager.total}
                        {manager.issue > 0 ? (
                          <span className="ml-1.5 font-semibold text-[var(--color-coral)]">
                            · {manager.issue} problem
                            {manager.issue === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full bg-[var(--color-cream-tint)]"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-1.5 rounded-full ${done >= 100 ? "bg-[var(--color-emerald)]" : "bg-[var(--color-amber)]"}`}
                        style={{ width: `${done}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <WeeklyChecksFilters
          filter={filters.filter}
          country={filters.country}
          q={filters.q}
          countries={data.countries}
        />
        <WeeklyChecksTable
          rows={data.rows}
          matching={data.matching}
          filter={filters.filter}
          isToday={data.isToday}
        />
      </div>
    </AdminWorkspace>
  );
}
