"use client";

import { motion } from "framer-motion";
import { emptyAdminExtractFilters } from "@/lib/admin-extract-filters";
import { CountryFlag } from "@/lib/country-icons";
import {
  ALL_SETUP_COUNTRIES,
  ALPHAA_SETUP_COUNTRIES,
  EUROPE_SETUP_COUNTRIES,
  SETUP_COUNTRIES,
} from "@/lib/setup-options";
import {
  EXTRACT_ALPHAA_EXTRA_PLATFORMS,
  EXTRACT_CORE_PLATFORMS,
  extractPlatformLabel,
} from "@/lib/admin-extract-platform";
import { accountScopeLabel, ACCOUNT_SCOPE_OPTIONS } from "@/lib/account-scope";
import type { AccountScope } from "@/types/db";
import type {
  AdminExtractFilters,
  AdminExtractRegionFilter,
  AdminExtractSpareFilter,
  AdminExtractStatusFilter,
  ExtractFiltersProps,
} from "@/types/admin";

const fieldClass =
  "cursor-pointer rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

const chipActive =
  "border-[var(--color-emerald)] bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]";
const chipIdle =
  "border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-cream-tint)]";

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function countriesForRegion(region: AdminExtractRegionFilter): string[] {
  if (region === "Africa") return [...SETUP_COUNTRIES];
  if (region === "Europe") return [...EUROPE_SETUP_COUNTRIES];
  if (region === "Alphaa") return [...ALPHAA_SETUP_COUNTRIES];
  return [...ALL_SETUP_COUNTRIES];
}

export function ExtractFilters({
  value,
  countries,
  onChange,
}: ExtractFiltersProps) {
  const countryOptions =
    countries.length > 0
      ? countries.filter((country) =>
          countriesForRegion(value.region).includes(country)
        )
      : countriesForRegion(value.region);
  const showAlphaaPlatforms =
    value.region === "all" || value.region === "Alphaa";
  const platformOptions = showAlphaaPlatforms
    ? [...EXTRACT_CORE_PLATFORMS, ...EXTRACT_ALPHAA_EXTRA_PLATFORMS]
    : [...EXTRACT_CORE_PLATFORMS];

  function patch(partial: Partial<AdminExtractFilters>) {
    onChange({ ...value, ...partial });
  }

  function setRegion(region: AdminExtractRegionFilter) {
    const allowedCountries = new Set(countriesForRegion(region));
    const allowedPlatforms = new Set<string>(
      region === "all" || region === "Alphaa"
        ? [...EXTRACT_CORE_PLATFORMS, ...EXTRACT_ALPHAA_EXTRA_PLATFORMS]
        : [...EXTRACT_CORE_PLATFORMS]
    );
    patch({
      region,
      countries: value.countries.filter((country) =>
        allowedCountries.has(country)
      ),
      platforms: value.platforms.filter((platform) =>
        allowedPlatforms.has(platform)
      ),
    });
  }

  return (
    <section
      aria-label="Extract filters"
      className="flex flex-col gap-4 rounded-[16px] bg-[var(--color-surface)] p-4 sm:p-5"
      style={{ boxShadow: "0 4px 24px rgba(20,20,20,.06)" }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
          Region
          <select
            value={value.region}
            aria-label="Filter by region"
            onChange={(event) =>
              setRegion(event.target.value as AdminExtractRegionFilter)
            }
            className={fieldClass}
          >
            <option value="all">All regions</option>
            <option value="Africa">Africa</option>
            <option value="Europe">Europe</option>
            <option value="Alphaa">Alphaa</option>
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
          Status
          <select
            value={value.status}
            aria-label="Filter by account status"
            onChange={(event) =>
              patch({
                status: event.target.value as AdminExtractStatusFilter,
              })
            }
            className={fieldClass}
          >
            <option value="active">Active only</option>
            <option value="all">All statuses</option>
            <option value="archived">Archived</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5 text-[12px] font-semibold text-[var(--color-muted)]">
          Spare accounts
          <select
            value={value.spare}
            aria-label="Filter spare accounts"
            onChange={(event) =>
              patch({ spare: event.target.value as AdminExtractSpareFilter })
            }
            className={fieldClass}
          >
            <option value="exclude">Exclude spare</option>
            <option value="include">Include spare</option>
            <option value="only">Spare only</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold text-[var(--color-muted)]">
          Platforms
          <span className="ml-1 font-medium text-[var(--color-muted)]">
            (empty = all)
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {platformOptions.map((platform) => {
            const active = value.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                aria-label={`Toggle ${extractPlatformLabel(platform)}`}
                aria-pressed={active}
                onClick={() =>
                  patch({
                    platforms: toggleValue(value.platforms, platform),
                  })
                }
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                  active ? chipActive : chipIdle
                }`}
              >
                {extractPlatformLabel(platform)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold text-[var(--color-muted)]">
          Account type
          <span className="ml-1 font-medium text-[var(--color-muted)]">
            (empty = both UMB & PER)
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_SCOPE_OPTIONS.map((scope) => {
            const active = value.scopes.includes(scope);
            return (
              <button
                key={scope}
                type="button"
                aria-label={`Toggle ${accountScopeLabel(scope)}`}
                aria-pressed={active}
                onClick={() =>
                  patch({
                    scopes: toggleValue<AccountScope>(value.scopes, scope),
                  })
                }
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                  active ? chipActive : chipIdle
                }`}
              >
                {accountScopeLabel(scope)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[12px] font-semibold text-[var(--color-muted)]">
          Countries
          <span className="ml-1 font-medium text-[var(--color-muted)]">
            (empty = all in region)
          </span>
        </legend>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--color-hairline)] p-2">
          <div className="flex flex-wrap gap-2">
            {countryOptions.map((country) => {
              const active = value.countries.includes(country);
              return (
                <button
                  key={country}
                  type="button"
                  aria-label={`Toggle ${country}`}
                  aria-pressed={active}
                  onClick={() =>
                    patch({
                      countries: toggleValue(value.countries, country),
                    })
                  }
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
                    active ? chipActive : chipIdle
                  }`}
                >
                  <CountryFlag
                    country={country}
                    title={country}
                    className="h-3.5 w-5 shrink-0"
                  />
                  {country}
                </button>
              );
            })}
          </div>
        </div>
        {value.countries.length > 0 ? (
          <button
            type="button"
            aria-label="Clear selected countries"
            onClick={() => patch({ countries: [] })}
            className="w-fit cursor-pointer rounded-lg text-[12px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Clear countries
          </button>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          aria-label="Reset extract filters"
          layout
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(emptyAdminExtractFilters())}
          className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-4 text-[14px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          Reset
        </motion.button>
      </div>
    </section>
  );
}
