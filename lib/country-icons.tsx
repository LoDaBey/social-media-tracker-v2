"use client";

import { createElement } from "react";
import type { ComponentType, SVGProps } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { SETUP_COUNTRIES } from "@/lib/setup-options";
import type { CountryFlagProps } from "@/types/setup";

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** ISO 3166-1 alpha-2 codes for setup countries. */
const COUNTRY_ISO: Record<(typeof SETUP_COUNTRIES)[number], string> = {
  Angola: "AO",
  "Burkina Faso": "BF",
  Cameroon: "CM",
  "Central African Republic": "CF",
  Chad: "TD",
  Comoros: "KM",
  Congo: "CG",
  Djibouti: "DJ",
  Gabon: "GA",
  Ghana: "GH",
  Guinea: "GN",
  "Ivory Coast": "CI",
  Libya: "LY",
  Madagascar: "MG",
  Mali: "ML",
  Mauritania: "MR",
  Mauritius: "MU",
  Mozambique: "MZ",
  Niger: "NE",
  Nigeria: "NG",
  Rwanda: "RW",
  Senegal: "SN",
  Somalia: "SO",
  "South Sudan": "SS",
  Sudan: "SD",
  Tanzania: "TZ",
  Uganda: "UG",
  Zambia: "ZM",
};

const FLAGS_BY_ISO = Flags as Record<string, FlagComponent | undefined>;

/** Stable flag components, resolved once at module load. */
const FLAG_BY_COUNTRY: Partial<Record<string, FlagComponent>> = {};
for (const [name, iso] of Object.entries(COUNTRY_ISO)) {
  const flag = FLAGS_BY_ISO[iso];
  if (flag) FLAG_BY_COUNTRY[name] = flag;
}

export function countryIsoCode(country: string): string | null {
  return COUNTRY_ISO[country as (typeof SETUP_COUNTRIES)[number]] ?? null;
}

export function CountryFlag({ country, title, className }: CountryFlagProps) {
  const flag = FLAG_BY_COUNTRY[country];
  if (!flag) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex h-4 w-6 items-center justify-center rounded-[2px] bg-[var(--color-hairline)] text-[10px] ${className ?? ""}`}
      >
        ?
      </span>
    );
  }

  return createElement(flag, {
    "aria-label": title ?? country,
    "aria-hidden": title ? undefined : true,
    className: `inline-block h-4 w-6 shrink-0 rounded-[2px] object-cover shadow-sm ${className ?? ""}`,
  });
}
