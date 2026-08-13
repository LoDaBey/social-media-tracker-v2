import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import { fetchManagerHomeGroups } from "@/lib/manager-data";
import { homePathForRole } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

export default async function ManagerHomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role !== "manager") redirect(homePathForRole(role));

  const managerId = Number(session.user.id);
  if (!Number.isFinite(managerId)) redirect("/login");

  const groups = await fetchManagerHomeGroups(managerId);

  return (
    <main className="w-full">
      <ManagerHomeTable groups={groups} />
    </main>
  );
}
