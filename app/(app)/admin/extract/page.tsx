import type { Metadata } from "next";
import { ALL_SETUP_COUNTRIES } from "@/lib/setup-options";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewExtract } from "@/lib/admin-view";
import { ExtractTool } from "./components/ExtractTool";

export const metadata: Metadata = {
  title: "Data extract",
};

export default function AdminExtractPage() {
  return (
    <AdminWorkspace view={adminViewExtract()}>
      <ExtractTool countries={[...ALL_SETUP_COUNTRIES]} />
    </AdminWorkspace>
  );
}
