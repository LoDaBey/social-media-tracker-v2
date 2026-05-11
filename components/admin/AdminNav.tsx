import Link from "next/link";
import { headers } from "next/headers";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/team-leads", label: "Team leads" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export async function AdminNav() {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/admin";

  return (
    <nav
      className="flex flex-wrap gap-8"
      aria-label="Administration sections"
    >
      {LINKS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex cursor-pointer rounded-none border-b-2 pb-3 text-[14px] font-semibold text-[var(--color-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] ${
              active
                ? "border-[var(--color-emerald)]"
                : "border-transparent hover:border-[var(--color-hairline)]"
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
