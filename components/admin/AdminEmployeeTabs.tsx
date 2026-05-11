import Link from "next/link";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "targets", label: "Targets" },
  { id: "wallet", label: "Wallet" },
  { id: "activity", label: "Activity" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function normalizeTab(tab: string | undefined): TabId {
  if (tab === "targets" || tab === "wallet" || tab === "activity") return tab;
  return "profile";
}

type Props = {
  userId: number;
  tab: string | undefined;
};

export function AdminEmployeeTabs({ userId, tab }: Props) {
  const current = normalizeTab(tab);

  return (
    <nav
      className="flex flex-wrap gap-6 border-b border-[var(--color-hairline)]"
      aria-label="Employee sections"
    >
      {TABS.map(({ id, label }) => {
        const active = current === id;
        return (
          <Link
            key={id}
            href={`/admin/employees/${userId}?tab=${id}`}
            className={`inline-flex cursor-pointer pb-3 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              active
                ? "border-b-2 border-[var(--color-emerald)] text-[var(--color-emerald)]"
                : "border-b-2 border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
