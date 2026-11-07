import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/lib/admin-access";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { fetchAlphaaEmployeeById } from "@/lib/admin-alphaa-employees-data";
import { adminViewAlphaaEmployee } from "@/lib/admin-view";
import { MAIN_PROJECT_LABEL } from "@/lib/project-labels";
import { AlphaaEmployeeProfile } from "./components/AlphaaEmployeeProfile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return { title: `${MAIN_PROJECT_LABEL} employee` };
  const profile = await fetchAlphaaEmployeeById(id);
  return { title: profile?.fullName ?? `${MAIN_PROJECT_LABEL} employee` };
}

export default async function AlphaaEmployeePage({ params }: PageProps) {
  await requireAdminPageAccess("employees");

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) notFound();

  const profile = await fetchAlphaaEmployeeById(id);
  if (!profile) notFound();

  return (
    <AdminWorkspace
      view={adminViewAlphaaEmployee({
        employeeName: profile.fullName,
        role: profile.mappedRole,
      })}
    >
      <AlphaaEmployeeProfile profile={profile} />
    </AdminWorkspace>
  );
}
