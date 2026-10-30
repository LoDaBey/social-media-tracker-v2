import type { AdminCoverageCount, AdminRegion } from "@/types/admin";

export type StrategyBook = "alphaa" | "africa_europe";

export type StrategyTab = "alphaa" | "africa" | "europe";

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
  totalActual: number;
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
  tab: StrategyTab;
  rows: StrategyCountryRow[];
  gapsByCountry: Record<string, StrategyCountryGaps>;
};

export type StrategyBookTabsProps = {
  tab: StrategyTab;
};

export type StrategyUploadButtonProps = {
  pending: boolean;
  onFile: (file: File) => void;
};

export type StrategyCountryOption = {
  country: string;
  totalAccounts: number;
  missing: number;
};

export type StrategyCountryNavProps = {
  countries: StrategyCountryOption[];
  selectedCountry: string;
  onSelect: (country: string) => void;
};

export type StrategyCountryPanelProps = {
  row: StrategyCountryRow;
  gaps: StrategyCountryGaps | undefined;
  saving: boolean;
  onSave: (input: StrategySaveCountryInput) => void;
};

export type StrategyCountryToolbarProps = {
  country: string;
  book: StrategyBook;
  language: string;
  language2: string;
  resources: number;
  saving: boolean;
  onLanguageChange: (value: string) => void;
  onLanguage2Change: (value: string) => void;
  onResourcesChange: (value: number) => void;
  onSave: () => void;
};

export type StrategyLanguageSelectProps = {
  id: string;
  label: string;
  value: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange: (value: string) => void;
};

export type StrategyCountryTotalsProps = {
  allAccounts: number;
  target: number;
  actual: number;
  missing: number;
  personal: number;
  umbrella: number;
  native: number;
  showNative: boolean;
};

export type StrategyPlatformIconProps = {
  platform: StrategyPlatformKey;
  className?: string;
};

export type StrategyPlatformCardProps = {
  platform: StrategyPlatformKey;
  book: StrategyBook;
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  missing: number;
  highlighted: boolean;
  highlightToken: number;
};

export type StrategyPlatformGridProps = {
  book: StrategyBook;
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  missingByPlatform: Partial<Record<StrategyPlatformKey, number>>;
  highlightedPlatform: StrategyPlatformKey | null;
  highlightToken: number;
};

export type StrategySheetGroup = {
  label: string;
  scope: StrategyAccountScope;
  platforms: StrategyPlatformKey[];
};

export type StrategyHandlerField = {
  label: string;
  platform: StrategyPlatformKey;
  scope: StrategyAccountScope | "all";
};

export type StrategyHandlerEditorProps = {
  book: StrategyBook;
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
};

export type StrategyHandlerFieldsProps = {
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  fields: StrategyHandlerField[];
};

export type StrategySheetEditorProps = {
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  label: string;
  groups: StrategySheetGroup[];
};

export type StrategyProjectGapsProps = {
  gaps: StrategyProjectGaps;
  onSelectPlatform?: (platform: StrategyPlatformKey) => void;
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
  /** Live non-spare accounts currently on the country. */
  accounts: number;
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
