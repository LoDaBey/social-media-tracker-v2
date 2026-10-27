import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import { baseCountryFromDisplay } from "@/lib/overview-country-display";
import { SETUP_CATEGORIES } from "@/lib/setup-options";
import type {
  AdminEmployeeSource,
  AdminSpareAccountListItem,
  SpareAccountFilters,
  SpareMarkHolderOption,
} from "@/types/admin";

export function spareAccountKey(source: AdminEmployeeSource, id: number) {
  return `${source}:${id}`;
}

function regionKey(region: string | null | undefined) {
  return region?.trim().toLowerCase() ?? "";
}

export function spareAccountsForRegion(
  accounts: AdminSpareAccountListItem[],
  region?: string | null
): AdminSpareAccountListItem[] {
  if (!region || region === "Overview") return accounts;
  if (region === "Alphaa") {
    return accounts.filter((account) => account.source === "alphaa");
  }
  if (region === "Africa") {
    return accounts.filter(
      (account) =>
        account.source === "temp" && regionKey(account.region) === "africa"
    );
  }
  return accounts.filter((account) => {
    if (account.source !== "temp") return false;
    const value = regionKey(account.region);
    return value === "europe" || value === "balkan";
  });
}

export function emptySpareAccountFilters(): SpareAccountFilters {
  return { project: "", platform: "", category: "" };
}

export function spareAccountFiltersActive(filters: SpareAccountFilters) {
  return Boolean(filters.project || filters.platform || filters.category);
}

function spareProjectKey(value: string | null | undefined) {
  return baseCountryFromDisplay(value ?? "").trim().toLowerCase();
}

function spareProjectKeys(item: {
  country: string | null;
  projects: string[];
}) {
  const keys = new Set<string>();
  const countryKey = spareProjectKey(item.country);
  if (countryKey) keys.add(countryKey);
  for (const project of item.projects) {
    const key = spareProjectKey(project);
    if (key) keys.add(key);
  }
  return keys;
}

export function filterSpareAccounts(
  accounts: AdminSpareAccountListItem[],
  filters: SpareAccountFilters
): AdminSpareAccountListItem[] {
  const projectKey = spareProjectKey(filters.project);
  const categoryKey = filters.category.trim().toLowerCase();
  return accounts.filter((account) => {
    if (projectKey && !spareProjectKeys(account).has(projectKey)) return false;
    if (filters.platform && account.platform !== filters.platform) return false;
    if (
      categoryKey &&
      (account.category ?? "").trim().toLowerCase() !== categoryKey
    ) {
      return false;
    }
    return true;
  });
}

export function filterSpareMarkHolders(
  holders: SpareMarkHolderOption[],
  filters: SpareAccountFilters
): SpareMarkHolderOption[] {
  const projectKey = spareProjectKey(filters.project);
  if (!projectKey) return holders;
  return holders.filter((holder) => spareProjectKeys(holder).has(projectKey));
}

function addProjectOption(
  byKey: Map<string, string>,
  value: string | null | undefined
) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  const key = spareProjectKey(trimmed);
  if (!key) return;
  const existing = byKey.get(key);
  if (!existing || trimmed.length > existing.length) {
    byKey.set(key, trimmed);
  }
}

export function spareProjectOptions(
  accounts: AdminSpareAccountListItem[],
  holders: SpareMarkHolderOption[]
): string[] {
  const byKey = new Map<string, string>();
  for (const account of accounts) {
    addProjectOption(byKey, account.country);
    for (const project of account.projects) addProjectOption(byKey, project);
  }
  for (const holder of holders) {
    addProjectOption(byKey, holder.country);
    for (const project of holder.projects) addProjectOption(byKey, project);
  }
  return [...byKey.values()].sort((left, right) => left.localeCompare(right));
}

export function sparePlatformOptions(
  accounts: AdminSpareAccountListItem[]
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const account of accounts) {
    if (!account.platform || seen.has(account.platform)) continue;
    seen.add(account.platform);
    options.push({
      value: account.platform,
      label: extractPlatformLabel(account.platform),
    });
  }
  return options.sort((left, right) => left.label.localeCompare(right.label));
}

export function spareCategoryOptions(
  accounts: AdminSpareAccountListItem[]
): string[] {
  const seen = new Set<string>(SETUP_CATEGORIES);
  for (const account of accounts) {
    const category = account.category?.trim();
    if (category) seen.add(category);
  }
  return [...seen].sort((left, right) => left.localeCompare(right));
}

function itemMatchesCountries(
  item: { country: string | null; projects: string[] },
  countryKeys: Set<string>
) {
  if (!countryKeys.size) return false;
  const countryKey = spareProjectKey(item.country);
  if (countryKey && countryKeys.has(countryKey)) return true;
  return item.projects.some((project) => {
    const key = spareProjectKey(project);
    return Boolean(key && countryKeys.has(key));
  });
}

export function spareCountryKeys(countries: string[]): Set<string> {
  const keys = new Set<string>();
  for (const country of countries) {
    const key = spareProjectKey(country);
    if (key) keys.add(key);
  }
  return keys;
}

export function spareAccountsForCountries(
  accounts: AdminSpareAccountListItem[],
  countries: string[]
): AdminSpareAccountListItem[] {
  const keys = spareCountryKeys(countries);
  return accounts.filter((account) => itemMatchesCountries(account, keys));
}

export function spareMarkHoldersForCountries(
  holders: SpareMarkHolderOption[],
  countries: string[]
): SpareMarkHolderOption[] {
  const keys = spareCountryKeys(countries);
  return holders.filter((holder) => itemMatchesCountries(holder, keys));
}

export function spareItemMatchesCountries(
  item: { country: string | null; projects: string[] },
  countries: string[]
) {
  return itemMatchesCountries(item, spareCountryKeys(countries));
}

export function spareMarkHoldersForRegion(
  holders: SpareMarkHolderOption[],
  region?: string | null
): SpareMarkHolderOption[] {
  if (!region || region === "Overview") return holders;
  if (region === "Alphaa") {
    return holders.filter((holder) => holder.source === "alphaa");
  }
  if (region === "Africa") {
    return holders.filter(
      (holder) => holder.source === "temp" && regionKey(holder.region) === "africa"
    );
  }
  return holders.filter((holder) => {
    if (holder.source !== "temp") return false;
    const value = regionKey(holder.region);
    return value === "europe" || value === "balkan";
  });
}
