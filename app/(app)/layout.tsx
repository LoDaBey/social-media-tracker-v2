import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Role } from "@/types/db";
import { ROLE_LABELS } from "@/lib/role-hierarchy";
import { AppHeader } from "@/components/layout/AppHeader";

function roleBadgeLabel(role: Role) {
  if (role === "team_lead") return `QC · ${ROLE_LABELS.team_lead}`;
  if (role === "admin") return ROLE_LABELS.admin;
  if (role === "manager") return ROLE_LABELS.manager;
  if (role === "op") return ROLE_LABELS.op;
  return null;
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const name = session.user?.name ?? "User";
  const email = session.user?.email ?? "";
  const role = (session.user?.role ?? "employee") as Role;
  const roleLabel = roleBadgeLabel(role);

  return (
    <div className="min-h-dvh bg-[var(--color-cream)]">
      <AppHeader
        name={name}
        email={email}
        role={role}
        roleLabel={roleLabel}
      />

      <div
        className={[
          "mx-auto w-full px-3 sm:px-8",
          role === "admin" || role === "manager"
            ? "max-w-[1600px]"
            : "max-w-7xl",
          role === "admin" ? "py-4 sm:py-6" : "py-8",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
