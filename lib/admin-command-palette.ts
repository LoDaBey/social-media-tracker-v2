import { adminEmployeeHref, adminRoleBadge } from "@/lib/admin-view";
import type { AdminEmployeeListRow } from "@/types/admin";
import type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPalettePerson,
} from "@/types/layout";

export const COMMAND_PALETTE_SPARE_EVENT = "orbit:open-spare";
export const COMMAND_PALETTE_RECENT_KEY = "orbit.admin.search.recent";
const RECENT_LIMIT = 6;

function haystack(item: CommandPaletteItem) {
  return `${item.title} ${item.subtitle} ${item.keywords ?? ""}`.toLowerCase();
}

function matches(item: CommandPaletteItem, query: string) {
  if (!query) return true;
  return haystack(item).includes(query);
}

export function commandPalettePeopleFromRows(
  rows: AdminEmployeeListRow[]
): CommandPalettePerson[] {
  return rows.map((row) => ({
    id: row.id,
    source: row.source,
    href: adminEmployeeHref(row.id, row.source),
    name: row.full_name,
    email: row.email,
    roleLabel: adminRoleBadge(row.role),
    code: row.employee_code,
    country: row.country,
    accounts: row.accounts.map((account) => ({
      name:
        account.account_name ||
        account.username ||
        account.account_handle ||
        "Account",
      platform: account.platform,
      username: account.username,
      handle: account.account_handle,
      url: account.account_url,
    })),
  }));
}

function personItems(people: CommandPalettePerson[]): CommandPaletteItem[] {
  return people.map((person) => {
    const accountKeywords = person.accounts
      .flatMap((account) => [
        account.name,
        account.platform,
        account.username,
        account.handle,
        account.url,
      ])
      .filter(Boolean)
      .join(" ");

    return {
      id: `person:${person.source}:${person.id}`,
      kind: "person" as const,
      title: person.name,
      subtitle: [person.roleLabel, person.country].filter(Boolean).join(" · "),
      keywords: [person.email, person.code, person.source, accountKeywords]
        .filter(Boolean)
        .join(" "),
      href: person.href,
    };
  });
}

function accountItems(people: CommandPalettePerson[]): CommandPaletteItem[] {
  return people.flatMap((person) =>
    person.accounts.map((account, index) => {
      const usernameOrHandle = account.username || account.handle;
      const subtitleParts = [
        person.name,
        account.platform,
        usernameOrHandle ? `@${usernameOrHandle.replace(/^@/, "")}` : null,
      ].filter(Boolean);

      return {
        id: `account:${person.source}:${person.id}:${index}`,
        kind: "account" as const,
        title: account.name,
        subtitle: subtitleParts.join(" · "),
        keywords: [
          account.platform,
          account.username,
          account.handle,
          account.url,
          person.name,
          person.email,
          person.country,
          person.code,
        ]
          .filter(Boolean)
          .join(" "),
        href: person.href,
      };
    })
  );
}

export function readCommandPaletteRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMMAND_PALETTE_RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function rememberCommandPaletteItem(id: string) {
  if (typeof window === "undefined") return;
  const next = [id, ...readCommandPaletteRecent().filter((item) => item !== id)].slice(
    0,
    RECENT_LIMIT
  );
  try {
    window.localStorage.setItem(COMMAND_PALETTE_RECENT_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function commandPaletteGroups(
  query: string,
  people: CommandPalettePerson[],
  recentIds: string[]
): CommandPaletteGroup[] {
  const needle = query.trim().toLowerCase();
  const peopleItems = personItems(people);
  const accounts = accountItems(people);
  const catalog = new Map(
    [...peopleItems, ...accounts].map((item) => [item.id, item])
  );

  if (!needle) {
    const recent = recentIds
      .map((id) => catalog.get(id))
      .filter((item): item is CommandPaletteItem => Boolean(item));
    return recent.length
      ? [{ id: "recent", label: "Recent", items: recent }]
      : [];
  }

  return [
    {
      id: "people",
      label: "People",
      items: peopleItems.filter((item) => matches(item, needle)),
    },
    {
      id: "accounts",
      label: "Accounts",
      items: accounts.filter((item) => matches(item, needle)),
    },
  ].filter((group) => group.items.length > 0);
}

export function flattenCommandPaletteGroups(groups: CommandPaletteGroup[]) {
  return groups.flatMap((group) => group.items);
}
