import Link from "next/link";
import { fetchTeamLeadOptions } from "@/lib/admin-data";
import { CreateEmployeeForm } from "@/components/admin/CreateEmployeeForm";

export default async function AdminNewEmployeePage() {
  const teamLeads = await fetchTeamLeadOptions();

  return (
    <main className="flex w-full flex-col gap-6">
      <Link
        href="/admin/employees"
        className="inline-flex w-fit cursor-pointer rounded-lg text-[14px] font-semibold text-[var(--color-emerald)] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        aria-label="Back to employees list"
      >
        ← Employees
      </Link>
      <CreateEmployeeForm teamLeads={teamLeads} />
    </main>
  );
}
