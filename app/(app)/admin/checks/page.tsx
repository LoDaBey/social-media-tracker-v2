import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Weekly checks",
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
          Weekly checks need the database update first (migration 0026).
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
      label: "Changed this week",
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
        <span className="self-start rounded-full bg-[var(--color-cream-tint)] px-3 py-1 text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
          {formatShortDate(data.weekStart)} – {formatShortDate(data.weekEnd)}
        </span>

        <section
          aria-label="Weekly check totals"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {cards.map((card) => (
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
          ))}
        </section>

        {data.managers.length > 0 ? (
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
                  <div
                    key={manager.managerId ?? "none"}
                    className="flex flex-col gap-1.5 rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2.5"
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
                  </div>
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
        />
      </div>
    </AdminWorkspace>
  );
}
