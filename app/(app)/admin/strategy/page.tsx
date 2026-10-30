import type { Metadata } from "next";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewStrategy } from "@/lib/admin-view";
import { fetchStrategyGapsByCountry } from "@/lib/strategy-actuals";
import { fetchStrategyRows } from "@/lib/strategy-plans-data";
import {
  strategyBookFromTab,
  strategyRegionFromTab,
  strategyTabFromSearchParams,
  strategyTabLabel,
} from "@/lib/strategy-tabs";
import { StrategyTool } from "./components/StrategyTool";

type StrategyPageProps = {
  searchParams: Promise<{ book?: string; region?: string }>;
};

export async function generateMetadata({
  searchParams,
}: StrategyPageProps): Promise<Metadata> {
  const params = await searchParams;
  const tab = strategyTabFromSearchParams(params);
  return {
    title: `Strategy · ${strategyTabLabel(tab)}`,
  };
}

export default async function AdminStrategyPage({ searchParams }: StrategyPageProps) {
  const params = await searchParams;
  const tab = strategyTabFromSearchParams(params);
  const book = strategyBookFromTab(tab);
  const region = strategyRegionFromTab(tab);
  const rows = await fetchStrategyRows(book, region);
  const gapsByCountry = await fetchStrategyGapsByCountry(book, rows);

  return (
    <AdminWorkspace view={adminViewStrategy()}>
      <StrategyTool key={tab} tab={tab} rows={rows} gapsByCountry={gapsByCountry} />
    </AdminWorkspace>
  );
}
