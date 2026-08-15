import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getManagerEmployeeSetupBundle } from "@/actions/manager-setup";
import { SetupForm } from "@/components/setup/SetupForm";
import { homePathForRole, isEmployeeSetupComplete } from "@/lib/setup-complete";
import type { Role } from "@/types/db";

type SearchParams = {
  employeeId?: string;
};

export default async function ManagerSetupPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user.role ?? "employee") as Role;
  if (role !== "manager") redirect(homePathForRole(role));

  const sp = (await searchParams) ?? {};
  const employeeIdRaw =
    typeof sp.employeeId === "string" ? Number(sp.employeeId) : NaN;
  if (!Number.isFinite(employeeIdRaw)) redirect("/manager");

  const bundle = await getManagerEmployeeSetupBundle(employeeIdRaw);
  if (!bundle) redirect("/manager");

  if (
    isEmployeeSetupComplete({
      country: bundle.employee.country,
      language: bundle.employee.language,
      targets: bundle.employee.targets,
      accountsByPlatform: bundle.existingByPlatform,
      setupNeedsReview: bundle.employee.setupNeedsReview,
    })
  ) {
    redirect("/manager");
  }

  return (
    <main className="w-full">
      <SetupForm
        userId={bundle.employee.id}
        fullName={bundle.employee.full_name}
        targets={bundle.employee.targets}
        existingByPlatform={bundle.existingByPlatform}
        initialProfile={{
          country: bundle.employee.country,
          language: bundle.employee.language ?? "",
        }}
        mode="manager"
        cancelHref="/manager"
      />
    </main>
  );
}
