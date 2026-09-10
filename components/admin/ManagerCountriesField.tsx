import { CountryFlag } from "@/lib/country-icons";
import {
  ALPHAA_SETUP_COUNTRIES,
  BALKAN_SETUP_COUNTRIES,
  SETUP_COUNTRIES,
  type SetupRegion,
} from "@/lib/setup-options";
import type { ManagerCountriesFieldProps } from "@/types/admin";
import { AdminFieldError } from "@/components/admin/AdminFieldError";

const REGION_GROUPS: { region: SetupRegion; countries: readonly string[] }[] = [
  { region: "Africa", countries: SETUP_COUNTRIES },
  { region: "Balkan", countries: BALKAN_SETUP_COUNTRIES },
  { region: "Alphaa", countries: ALPHAA_SETUP_COUNTRIES },
];

function CountryCheckbox({
  option,
  checked,
  onToggle,
}: {
  option: string;
  checked: boolean;
  onToggle: (country: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--color-ink)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(option)}
        className="rounded outline-none"
        aria-label={`Include ${option}`}
      />
      <CountryFlag country={option} className="h-5 w-7" />
      <span>{option}</span>
    </label>
  );
}

export function ManagerCountriesField({
  selected,
  error,
  onToggle,
}: ManagerCountriesFieldProps) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-[13px] font-semibold text-[var(--color-muted)]">
        Countries
      </legend>
      <p className="mt-1 text-[12px] font-medium text-[var(--color-muted)]">
        Choose every country this manager can set up employees in, grouped by region.
      </p>
      <div
        className={`mt-2 flex max-h-80 flex-col gap-4 overflow-y-auto rounded-lg border bg-[var(--color-cream-tint)] p-4 ${
          error
            ? "border-[var(--color-coral)]"
            : "border-[var(--color-hairline)]"
        }`}
      >
        {REGION_GROUPS.map(({ region, countries }) => (
          <section key={region} aria-label={`${region} countries`}>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-muted)]">
              {region === "Alphaa" ? "ALPHAA" : region}
            </h3>
            <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[...countries]
                .sort((a, b) => a.localeCompare(b))
                .map((option) => (
                  <CountryCheckbox
                    key={option}
                    option={option}
                    checked={selected.includes(option)}
                    onToggle={onToggle}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
      <AdminFieldError id="manager-countries-error" message={error} />
    </fieldset>
  );
}
