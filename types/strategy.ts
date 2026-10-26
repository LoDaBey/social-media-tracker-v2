import type { AdminCoverageCount, AdminRegion } from "@/types/admin";

export type StrategyBook = "alphaa" | "africa_europe";

export type StrategyAccountScope = "personal" | "umbrella" | "native";

export type StrategyPlatformKey =
  | "twitter"
  | "facebook"
  | "instagram"
  | "threads"
  | "reddit"
  | "youtube"
  | "blogspot"
  | "tiktok"
  | "telegram"
  | "website"
  | "pinterest"
  | "turkkitap"
  | "kizlarsoruyor"
  | "balatarin";

export type StrategyScopeCounts = Partial<
  Record<StrategyPlatformKey, Partial<Record<StrategyAccountScope, number>>>
>;

export type StrategyCountryRow = {
  book: StrategyBook;
  region: "Africa" | "Europe" | "Alphaa";
  country: string;
  language: string;
  language2: string | null;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
  updatedAt: string;
};

export type StrategySaveCountryInput = {
  book: StrategyBook;
  country: string;
  language: string;
  language2?: string | null;
  region?: "Africa" | "Europe";
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
};

export type StrategyImportResult = {
  success: boolean;
  message: string;
  alphaaCount?: number;
  africaEuropeCount?: number;
};

/** Alpha Assets "Region" is geography (Levant, Gulf), not Africa/Europe/ALPHAA books. */
export type StrategyExcelParseOptions = {
  ignoreExcelRegion?: boolean;
};

export type StrategyGapLine = {
  platform: StrategyPlatformKey;
  scope: StrategyAccountScope | "all";
  planned: number;
  actual: number;
  missing: number;
};

export type StrategyProjectGaps = {
  country: string;
  totalPlanned: number;
  lines: StrategyGapLine[];
};

export type StrategyHandlerGap = {
  id: number | null;
  fullName: string;
  vacant: boolean;
  lines: StrategyGapLine[];
};

export type StrategyCountryGaps = {
  project: StrategyProjectGaps;
  handlers: StrategyHandlerGap[];
};

export type StrategyToolProps = {
  book: StrategyBook;
  rows: StrategyCountryRow[];
  gapsByCountry: Record<string, StrategyCountryGaps>;
};

export type StrategyBookTabsProps = {
  book: StrategyBook;
};

export type StrategyUploadButtonProps = {
  pending: boolean;
  onFile: (file: File) => void;
};

export type StrategyProjectTableProps = {
  book: StrategyBook;
  rows: StrategyCountryRow[];
  expandedCountry: string | null;
  onToggle: (country: string) => void;
  savingCountry: string | null;
  onSave: (input: StrategySaveCountryInput) => void;
  gapsByCountry: Record<string, StrategyCountryGaps>;
};

export type StrategyCountryPanelProps = {
  row: StrategyCountryRow;
  gaps: StrategyCountryGaps | undefined;
  saving: boolean;
  onSave: (input: StrategySaveCountryInput) => void;
};

export type StrategySheetGroup = {
  label: string;
  scope: StrategyAccountScope;
  platforms: StrategyPlatformKey[];
};

export type StrategyHandlerEditorProps = {
  book: StrategyBook;
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
};

export type StrategySheetEditorProps = {
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  label: string;
  groups: StrategySheetGroup[];
};

export type StrategyProjectGapsProps = {
  gaps: StrategyProjectGaps;
};

export type StrategyPageSearchParams = {
  book?: string;
  region?: string;
};

export type AdminStrategyRegion = Extract<AdminRegion, "Africa" | "Europe" | "Alphaa">;

export type StrategyActualsSnapshot = {
  employees: number;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  extraPlatforms: Partial<Record<StrategyPlatformKey, number>>;
};

export type StrategyHolderSnapshot = {
  id: number;
  fullName: string;
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  extraPlatforms: Partial<Record<StrategyPlatformKey, number>>;
};

export type { AdminCoverageCount };
