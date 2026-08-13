import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homePathForRole } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user?.role ?? "employee") as Role;
  redirect(homePathForRole(role));
}
