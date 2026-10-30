import type { StrategyBook, StrategyTab } from "@/types/strategy";

export const STRATEGY_TABS: { tab: StrategyTab; label: string }[] = [
  { tab: "alphaa", label: "ALPHAA" },
  { tab: "africa", label: "Africa" },
  { tab: "europe", label: "Europe" },
];

export function strategyTabLabel(tab: StrategyTab): string {
  if (tab === "africa") return "Africa";
  if (tab === "europe") return "Europe";
  return "ALPHAA";
}

export function strategyBookFromTab(tab: StrategyTab): StrategyBook {
  return tab === "alphaa" ? "alphaa" : "africa_europe";
}

export function strategyRegionFromTab(
  tab: StrategyTab
): "Africa" | "Europe" | undefined {
  if (tab === "africa") return "Africa";
  if (tab === "europe") return "Europe";
  return undefined;
}

export function strategyTabFromSearchParams(params: {
  book?: string;
  region?: string;
}): StrategyTab {
  if (params.book === "europe") return "europe";
  if (params.book === "africa") return "africa";
  if (params.book === "africa_europe") {
    return params.region === "Europe" ? "europe" : "africa";
  }
  if (params.region === "Europe") return "europe";
  if (params.region === "Africa") return "africa";
  return "alphaa";
}
