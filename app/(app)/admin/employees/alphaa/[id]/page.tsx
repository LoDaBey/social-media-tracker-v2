import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { fetchAlphaaEmployeeById } from "@/lib/admin-alphaa-employees-data";
import { adminViewAlphaaEmployee } from "@/lib/admin-view";
import { AlphaaEmployeeProfile } from "./components/AlphaaEmployeeProfile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return { title: "ALPHAA employee" };
  const profile = await fetchAlphaaEmployeeById(id);
  return { title: profile?.fullName ?? "ALPHAA employee" };
}

export default async function AlphaaEmployeePage({ params }: PageProps) {
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
