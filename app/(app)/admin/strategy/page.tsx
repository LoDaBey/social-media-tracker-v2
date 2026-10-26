import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { adminViewStrategy } from "@/lib/admin-view";
import { fetchStrategyGapsByCountry } from "@/lib/strategy-actuals";
import { fetchStrategyRows } from "@/lib/strategy-plans-data";
import type { StrategyBook } from "@/types/strategy";
import { StrategyTool } from "./components/StrategyTool";

type StrategyPageProps = {
  searchParams: Promise<{ book?: string }>;
};

function bookFromParam(value: string | undefined): StrategyBook {
  return value === "africa_europe" ? "africa_europe" : "alphaa";
}

export default async function AdminStrategyPage({ searchParams }: StrategyPageProps) {
  const params = await searchParams;
  const book = bookFromParam(params.book);
  const rows = await fetchStrategyRows(book);
  const gapsByCountry = await fetchStrategyGapsByCountry(book, rows);

  return (
    <AdminWorkspace view={adminViewStrategy()}>
      <StrategyTool book={book} rows={rows} gapsByCountry={gapsByCountry} />
    </AdminWorkspace>
  );
}
