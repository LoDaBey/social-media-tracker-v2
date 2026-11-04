import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminViewerOrNull } from "@/lib/admin-access";
import { ALL_SETUP_COUNTRIES } from "@/lib/setup-options";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewExtract } from "@/lib/admin-view";
import { ExtractTool } from "./components/ExtractTool";

export const metadata: Metadata = {
  title: "Data extract",
};

export default async function AdminExtractPage() {
  const viewer = await getAdminViewerOrNull();
  if (!viewer) redirect("/login");

  const countries =
    viewer.role === "op" && viewer.scope
      ? viewer.scope.countries
      : [...ALL_SETUP_COUNTRIES];

  return (
    <AdminWorkspace view={adminViewExtract()}>
      <ExtractTool countries={countries} />
    </AdminWorkspace>
  );
}
