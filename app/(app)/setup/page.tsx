import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { homePathForRole } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

/** Employee self-setup is retired — Managers own SMD account setup. */
export default async function SetupPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role === "manager") redirect("/manager");
  redirect(homePathForRole(role));
}
