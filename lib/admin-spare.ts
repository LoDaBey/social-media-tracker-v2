import type {
  AdminEmployeeSource,
  AdminSpareAccountListItem,
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
