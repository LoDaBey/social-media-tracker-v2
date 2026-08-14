import { CountryFlag } from "@/lib/country-icons";
import { SETUP_COUNTRIES } from "@/lib/setup-options";
import type { ManagerCountriesFieldProps } from "@/types/admin";
import { AdminFieldError } from "@/components/admin/AdminFieldError";

export function ManagerCountriesField({
  selected,
  error,
  onToggle,
}: ManagerCountriesFieldProps) {
  return (
    <fieldset className="sm:col-span-2 lg:col-span-2">
      <legend className="text-[13px] font-semibold text-[var(--color-muted)]">
        Countries
      </legend>
      <p className="mt-1 text-[12px] font-medium text-[var(--color-muted)]">
        Choose every country this manager can set up employees in.
      </p>
      <div
        className={`mt-2 grid max-h-80 grid-cols-1 gap-2.5 overflow-y-auto rounded-lg border bg-[var(--color-cream-tint)] p-4 sm:grid-cols-2 lg:grid-cols-3 ${
          error
            ? "border-[var(--color-coral)]"
            : "border-[var(--color-hairline)]"
        }`}
      >
        {SETUP_COUNTRIES.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-[var(--color-ink)]"
            >
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
        })}
      </div>
      <AdminFieldError id="manager-countries-error" message={error} />
    </fieldset>
  );
}
