import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="w-full">
      <div className="relative left-1/2 w-screen max-w-none -translate-x-1/2 border-b border-[var(--color-hairline)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-7xl items-center px-8 py-3">
          <AdminNav />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-8 pb-12 pt-6">{children}</div>
    </div>
  );
}
