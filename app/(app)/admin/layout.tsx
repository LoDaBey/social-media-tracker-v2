import { redirect } from "next/navigation";
import { getAdminViewerOrNull } from "@/lib/admin-access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getAdminViewerOrNull();
  if (!viewer) redirect("/login");

  return <div className="w-full">{children}</div>;
}
