import type { AdminCoverageCount, AdminRegion } from "@/types/admin";

export type StrategyBook = "alphaa" | "africa_europe" | "custom";

/** Geographic region stamped onto the project's accounts, e.g. Gulf, Asia, Levant. */
export type StrategyProjectRegion = string;

export type StrategyProject = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  region: StrategyProjectRegion | "";
  platforms: StrategyPlatformKey[];
  language: string;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
  subProjects: StrategyProject[];
  updatedAt: string;
};

export type StrategyProjectSummary = {
  name: string;
  slug: string;
};

export type StrategyCreateProjectInput = {
  name: string;
  region: StrategyProjectRegion | "";
  platforms: StrategyPlatformKey[];
};

export type StrategySaveSubProjectInput = {
  slug?: string;
  name: string;
  language: string;
  resources: number;
  projectTargets: StrategyScopeCounts;
};

export type StrategySaveProjectInput = {
  slug: string;
  region: StrategyProjectRegion | "";
  platforms: StrategyPlatformKey[];
  language: string;
  resources: number;
  totalAccounts: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
  subProjects: StrategySaveSubProjectInput[];
};

export type StrategySubProjectDraft = {
  key: string;
  slug: string | null;
  name: string;
  language: string;
  resources: number;
  projectTargets: StrategyScopeCounts;
  handlerTargets: StrategyScopeCounts;
};

export type StrategyCreateProjectResult =
  | { ok: true; project: StrategyProjectSummary }
  | { ok: false; error: string };

export type StrategySaveProjectResult =
  | { ok: true }
  | { ok: false; error: string };

export type StrategyDeleteProjectResult =
  | { ok: true }
  | { ok: false; error: string };

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
  selectedSlug: string | null;
  projects: StrategyProjectSummary[];
  activeProject: StrategyProject | null;
  regionOptions: string[];
};

export type StrategyBookTabsProps = {
  selectedSlug: string | null;
  projects: StrategyProjectSummary[];
};

export type StrategyNewProjectButtonProps = {
  onClick: () => void;
};

export type StrategyNewProjectModalProps = {
  open: boolean;
  pending: boolean;
  error: string | null;
  regionOptions: string[];
  onClose: () => void;
  onCreate: (input: StrategyCreateProjectInput) => void;
};

export type StrategyDeleteProjectButtonProps = {
  name: string;
  onClick: () => void;
};

export type StrategyEditProjectButtonProps = {
  name: string;
  onClick: () => void;
};

export type StrategyDeleteProjectModalProps = {
  open: boolean;
  pending: boolean;
  error: string | null;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
};

export type StrategyProjectPlatformPickerProps = {
  value: StrategyPlatformKey[];
  onChange: (next: StrategyPlatformKey[]) => void;
  readOnly?: boolean;
};

export type StrategyProjectRegionSelectProps = {
  id: string;
  value: StrategyProjectRegion | "";
  options: string[];
  required?: boolean;
  emptyLabel?: string;
  layout?: "stack" | "inline";
  onChange: (value: StrategyProjectRegion | "") => void;
};

export type StrategyProjectToolbarProps = {
  name: string;
  region: StrategyProjectRegion | "";
  regionOptions: string[];
  resources: number;
  resourcesLocked?: boolean;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onRegionChange: (value: StrategyProjectRegion | "") => void;
  onResourcesChange: (value: number) => void;
  onSave: () => void;
  onDelete: () => void;
};

export type StrategyProjectPanelProps = {
  project: StrategyProject;
  saving: boolean;
  regionOptions: string[];
  onSave: (input: StrategySaveProjectInput) => Promise<boolean>;
  onDelete: () => void;
};

export type StrategyUploadButtonProps = {
  pending: boolean;
  onFile: (file: File) => void;
};

export type StrategyEmptyStateProps = {
  onCreate: () => void;
};

export type StrategyCountryOption = {
  country: string;
  totalAccounts: number;
};

export type StrategyCountryNavProps = {
  countries: StrategyCountryOption[];
  selectedCountry: string;
  onSelect: (country: string) => void;
};

export type StrategyCountryPanelProps = {
  row: StrategyCountryRow;
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

export type StrategyTotalsKind = "personal" | "umbrella" | "native";

export type StrategyTotalsHeroProps = {
  value: number;
};

export type StrategyTotalsRowProps = {
  kind: StrategyTotalsKind;
  value: number;
};

export type StrategyCountryTotalsProps = {
  allAccounts: number;
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
  readOnly?: boolean;
};

export type StrategyPlatformGridProps = {
  book: StrategyBook;
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  platforms?: StrategyPlatformKey[];
  showHeader?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
  label?: string;
  description?: string;
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
  platforms?: StrategyPlatformKey[];
  description?: string;
  readOnly?: boolean;
};

export type StrategyHandlerFieldsProps = {
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  fields: StrategyHandlerField[];
  readOnly?: boolean;
};

export type StrategyHandlerSeatCardProps = {
  platform: StrategyPlatformKey;
  fields: StrategyHandlerField[];
  value: StrategyScopeCounts;
  onChange: (next: StrategyScopeCounts) => void;
  readOnly?: boolean;
};

export type StrategySubProjectOption = {
  key: string;
  name: string;
  totalAccounts: number;
};

export type StrategySubProjectNavProps = {
  projects: StrategySubProjectOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

export type StrategyAddSubProjectButtonProps = {
  onClick: () => void;
};

export type StrategyAddSubProjectModalProps = {
  open: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (input: { name: string; language: string }) => void;
};

export type StrategyDeleteSubProjectButtonProps = {
  name: string;
  onClick: () => void;
};

export type StrategyDeleteSubProjectModalProps = {
  open: boolean;
  name: string;
  onClose: () => void;
  onConfirm: () => void;
};

export type StrategySubProjectSectionProps = {
  drafts: StrategySubProjectDraft[];
  selectedKey: string | null;
  platforms: StrategyPlatformKey[];
  editing: boolean;
  onSelect: (key: string) => void;
  onChange: (key: string, next: StrategySubProjectDraft) => void;
  onAdd: (input: { name: string; language: string }) => boolean;
  onDelete: (key: string) => void;
};

export type StrategyPageSearchParams = {
  book?: string;
  region?: string;
  project?: string;
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
