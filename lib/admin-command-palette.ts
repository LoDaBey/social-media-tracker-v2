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

const PAGE_ITEMS: CommandPaletteItem[] = [
  {
    id: "page:overview",
    kind: "page",
    title: "Overview",
    subtitle: "Coverage and country plan",
    href: "/admin",
  },
  {
    id: "page:employees",
    kind: "page",
    title: "Employees",
    subtitle: "People, codes, and accounts",
    href: "/admin/employees",
  },
  {
    id: "page:strategy",
    kind: "page",
    title: "Strategy",
    subtitle: "Projects and country plans",
    href: "/admin/strategy",
  },
  {
    id: "page:activity",
    kind: "page",
    title: "Activity",
    subtitle: "Admin change log",
    href: "/admin/logs",
  },
  {
    id: "page:extract",
    kind: "page",
    title: "Data extract",
    subtitle: "Export tracked accounts",
    href: "/admin/extract",
  },
  {
    id: "page:settings",
    kind: "page",
    title: "Settings",
    subtitle: "Password and account",
    href: "/settings",
  },
];

const ACTION_ITEMS: CommandPaletteItem[] = [
  {
    id: "action:new-employee",
    kind: "action",
    title: "New employee",
    subtitle: "Create a person on the roster",
    href: "/admin/employees/new",
  },
  {
    id: "action:spare",
    kind: "action",
    title: "Spare accounts",
    subtitle: "Mark or unmark extras",
    action: "spare",
  },
];

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
    })),
  }));
}

function personItems(people: CommandPalettePerson[]): CommandPaletteItem[] {
  return people.map((person) => ({
    id: `person:${person.source}:${person.id}`,
    kind: "person",
    title: person.name,
    subtitle: [person.roleLabel, person.country].filter(Boolean).join(" · "),
    keywords: [person.email, person.code, person.source]
      .filter(Boolean)
      .join(" "),
    href: person.href,
  }));
}

function accountItems(people: CommandPalettePerson[]): CommandPaletteItem[] {
  return people.flatMap((person) =>
    person.accounts.map((account, index) => ({
      id: `account:${person.source}:${person.id}:${index}`,
      kind: "account" as const,
      title: account.name,
      subtitle: person.name,
      keywords: [account.platform, person.email, person.country, person.code]
        .filter(Boolean)
        .join(" "),
      href: person.href,
    }))
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
    [...peopleItems, ...accounts, ...ACTION_ITEMS, ...PAGE_ITEMS].map((item) => [
      item.id,
      item,
    ])
  );

  if (!needle) {
    const recent = recentIds
      .map((id) => catalog.get(id))
      .filter((item): item is CommandPaletteItem => Boolean(item));
    return [
      recent.length
        ? { id: "recent", label: "Recent", items: recent }
        : null,
      { id: "actions", label: "Actions", items: ACTION_ITEMS },
      { id: "goto", label: "Go to", items: PAGE_ITEMS },
    ].filter((group): group is CommandPaletteGroup => Boolean(group));
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
    {
      id: "actions",
      label: "Actions",
      items: ACTION_ITEMS.filter((item) => matches(item, needle)),
    },
    {
      id: "goto",
      label: "Go to",
      items: PAGE_ITEMS.filter((item) => matches(item, needle)),
    },
  ].filter((group) => group.items.length > 0);
}

export function flattenCommandPaletteGroups(groups: CommandPaletteGroup[]) {
  return groups.flatMap((group) => group.items);
}
