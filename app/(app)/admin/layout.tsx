import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminWorkspaceRole } from "@/lib/role-hierarchy";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = session.user.role;
  if (!isAdminWorkspaceRole(role)) redirect("/dashboard");

  return <div className="w-full">{children}</div>;
}
