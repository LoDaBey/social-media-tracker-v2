import type { SetupRegion } from "@/lib/setup-options";
import type { Platform, Role, EmploymentStatus, AccountScope } from "@/types/db";
import type { ReactNode } from "react";
export type AdminEmployeeCycleStatus = "pending" | "mid-cycle" | "payable";

export type AdminEmployeeListFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  role?: "all" | "employee" | "manager" | "team_lead" | "op";
  region?: "Africa" | "Europe" | "Alphaa";
  country?: string;
  teamLeadId?: number | null;
};

export type AdminEmployeeSource = "temp" | "alphaa";

export type AdminEmployeeListRow = {
  id: number;
  /** temp = Africa/Europe roster; alphaa = legacy users + social_media_accounts. */
  source: "temp" | "alphaa";
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  employee_code: string | null;
  employment_status: EmploymentStatus;
  team_lead_id: number | null;
  team_lead_name: string | null;
  manager_id: number | null;
  manager_name: string | null;
  op_id: number | null;
  op_name: string | null;
  country: string | null;
  language: string | null;
  countries: string[];
  current_level: number;
  target_accounts_sum: number;
  cycle_status: AdminEmployeeCycleStatus;
  accounts: AdminSocialAccountListItem[];
};

export type CreateEmployeePayload = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: Role;
  team_lead_id?: number | null;
  manager_id?: number | null;
  op_id?: number | null;
  /** Required when role is manager — one or more countries this manager owns. */
  manager_countries?: string[];
  base_salary?: number;
  hire_date?: string;
  pay_cycle_start_date?: string | null;
  current_level?: number;
  country: string;
};

export type CreateEmployeeResult = { id: number } | { error: string };

export type CreateEmployeeFieldKey =
  | "full_name"
  | "email"
  | "password"
  | "country"
  | "supervisor_id"
  | "manager_id"
  | "manager_countries";

export type CreateEmployeeFieldErrors = Partial<
  Record<CreateEmployeeFieldKey, string>
>;

export type ValidateCreateEmployeeInput = {
  full_name: string;
  email: string;
  password: string;
  role: Role;
  country: string;
  supervisor_id: string;
  manager_id: number | null;
  team_lead_id: number | null;
  manager_countries: string[];
};

export type AdminFieldErrorProps = {
  id: string;
  message?: string;
};

export type ManagerCountriesFieldProps = {
  selected: string[];
  error?: string;
  onToggle: (country: string) => void;
};

export type UpdateEmployeeProfilePayload = {
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  employee_code: string | null;
  employment_status: EmploymentStatus;
  hire_date: string;
  team_lead_id: number | null;
  manager_id: number | null;
  op_id: number | null;
  manager_countries?: string[];
  base_salary: number;
  current_level: number;
  pay_cycle_start_date: string | null;
  country: string;
};

export type UpdateEmployeeTargetsPayload = {
  target_x_count: number;
  target_facebook_personal_count: number;
  target_facebook_umbrella_count: number;
  target_instagram_count: number;
  target_tiktok_count: number;
};

export type AdminViewKind =
  | "overview"
  | "employees"
  | "employee_new"
  | "employee"
  | "alphaa_employee"
  | "extract"
  | "strategy";

export type AdminEmployeePanel = "profile" | "targets" | "activity";

export type AdminView =
  | { kind: "overview"; title: string }
  | { kind: "employees"; title: string }
  | { kind: "employee_new"; title: string }
  | { kind: "extract"; title: string }
  | { kind: "strategy"; title: string }
  | {
      kind: "employee";
      title: string;
      employeeId: number;
      employeeName: string;
      roleBadge: string;
      panel: AdminEmployeePanel;
    }
  | {
      kind: "alphaa_employee";
      title: string;
      roleBadge: string;
    };

export type AlphaaEmployeeProfile = {
  id: number;
  fullName: string;
  email: string;
  roleLabel: string;
  mappedRole: Role;
  phone: string | null;
  country: string | null;
  countries: string[];
  language: string | null;
  isActive: boolean;
  department: string | null;
  location: string | null;
  projects: string[];
  accounts: AdminSocialAccountListItem[];
};

export type AlphaaEmployeeProfileProps = {
  profile: AlphaaEmployeeProfile;
};

export type AlphaaEmployeeFormInitial = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  roleLabel: string;
  country: string;
  department: string;
  location: string;
  projects: string[];
  isActive: boolean;
};

export type UpdateAlphaaEmployeePayload = {
  fullName: string;
  email: string;
  phone: string | null;
  roleLabel: string;
  country: string;
  department: string | null;
  location: string | null;
  projects: string[];
  isActive: boolean;
};

export type AlphaaEmployeeFormProps = {
  initial: AlphaaEmployeeFormInitial;
};

export type AdminWorkspaceProps = {
  view: AdminView;
  children: ReactNode;
};

export type AdminPageLoaderProps = {
  label?: string;
};

export type EmployeeFormInitial = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  employee_code: string | null;
  employment_status: EmploymentStatus;
  hire_date: string;
  team_lead_id: number | null;
  manager_id: number | null;
  op_id: number | null;
  manager_countries: string[];
  base_salary: string;
  current_level: number;
  pay_cycle_start_date: string | null;
  country: string;
  /** Bumps when the user row changes so the parent can reset client form state via `key`. */
  updated_at: string;
};

export type AdminSupervisorOption = {
  id: number;
  full_name: string;
};

export type AdminTeamLeadOption = AdminSupervisorOption & {
  manager_id: number | null;
};

export type AdminManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
};

export type SupervisorAssignFieldProps = {
  userRole: Role;
  value: number | null;
  onChange: (supervisorId: number | null) => void;
  teamLeads: AdminTeamLeadOption[];
  managers: AdminManagerOption[];
  ops: AdminSupervisorOption[];
  admins: AdminSupervisorOption[];
  disabled?: boolean;
  error?: string;
  errorId?: string;
  fieldClass: string;
  invalidFieldClass: string;
};

export type EmployeeReportingValue = {
  managerId: number | null;
  teamLeadId: number | null;
};

export type EmployeeReportingFieldsProps = {
  value: EmployeeReportingValue;
  onChange: (next: EmployeeReportingValue) => void;
  teamLeads: AdminTeamLeadOption[];
  managers: AdminManagerOption[];
  country?: string;
  disabled?: boolean;
  managerError?: string;
  managerErrorId?: string;
  fieldClass: string;
  invalidFieldClass: string;
};

export type AdminKpiTileProps = {
  title: string;
  value: string;
  icon:
    | "users"
    | "clipboard"
    | "wallet"
    | "refresh"
    | "globe"
    | "layers"
    | "pause"
    | "spare";
  subtitle?: string;
};

/** ALPHAA-only extended platforms (legacy social_media_accounts). */
export type AlphaaExtraPlatformKey =
  | "threads"
  | "reddit"
  | "youtube"
  | "blogspot"
  | "telegram"
  | "website"
  | "pinterest"
  | "turkkitap"
  | "kizlarsoruyor"
  | "balatarin";

export type AlphaaExtraPlatformCounts = Partial<
  Record<AlphaaExtraPlatformKey, number>
>;

export type AlphaaExtraPlatformCoverage = Partial<
  Record<AlphaaExtraPlatformKey, AdminCoverageCount>
>;

export type AdminCountrySeatQuota = {
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  totalAccounts: number;
  extraPlatforms?: AlphaaExtraPlatformCounts;
};

export type AdminCountryPlan = {
  country: string;
  language: string;
  resources: number;
  xPersonal: number;
  facebookPersonal: number;
  xUmbrella: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  totalAccounts: number;
  extraPlatforms?: AlphaaExtraPlatformCounts;
  /** Per-handler template from strategy tables. Same quota for every seat. */
  handlerSeat?: AdminCountrySeatQuota;
};

export type AdminCoverageCount = {
  actual: number;
  target: number;
};

export type AdminCountryCoverageHolder = {
  id: number | null;
  source: "temp" | "alphaa";
  fullName: string;
  email: string | null;
  vacant: boolean;
  x: AdminCoverageCount;
  facebookPersonal: AdminCoverageCount;
  facebookUmbrella: AdminCoverageCount;
  instagram: AdminCoverageCount;
  tiktok: AdminCoverageCount;
  totalAccounts: AdminCoverageCount;
  extraPlatforms?: AlphaaExtraPlatformCoverage;
};

export type AdminCountryCoverageRow = {
  country: string;
  language: string;
  onPlan: boolean;
  resources: AdminCoverageCount;
  x: AdminCoverageCount;
  facebookPersonal: AdminCoverageCount;
  facebookUmbrella: AdminCoverageCount;
  instagram: AdminCoverageCount;
  tiktok: AdminCoverageCount;
  totalAccounts: AdminCoverageCount;
  extraPlatforms?: AlphaaExtraPlatformCoverage;
  holders: AdminCountryCoverageHolder[];
};

export type AdminCountryCoverageTotals = Omit<
  AdminCountryCoverageRow,
  "country" | "language" | "onPlan" | "holders"
>;

export type AdminCountryCoverage = {
  rows: AdminCountryCoverageRow[];
  totals: AdminCountryCoverageTotals;
  onHoldCount: number;
  /** Active Africa/Europe accounts marked spare (excluded from plan actuals). */
  spareCount: number;
};

export type AdminRegion = "Overview" | "Africa" | "Europe" | "Alphaa";

export type AdminRegionSlug = "overview" | "africa" | "europe" | "alphaa";

export type AdminCountryCoverageFilter = {
  countries?: string[];
  region?: AdminRegion;
};

export type AdminCoverageKpisProps = {
  coverage: AdminCountryCoverage;
};

export type AdminCountryCoverageSectionProps = {
  coverage: AdminCountryCoverage;
  region: AdminRegion;
};

export type BalanceCoverageSpareChange = {
  country: string;
  platform: string;
  platformLabel: string;
  handlerName: string;
  accountId: number;
  username: string | null;
  source: AdminEmployeeSource;
};

export type BalanceCoverageSpareGap = {
  country: string;
  platform: string;
  platformLabel: string;
  actual: number;
  target: number;
  missing: number;
  spareAvailable: number;
};

export type BalanceCoverageSpareResult = {
  applied: boolean;
  marked: BalanceCoverageSpareChange[];
  unmarked: BalanceCoverageSpareChange[];
  missing: BalanceCoverageSpareGap[];
  error?: string;
};

export type BalanceCoverageButtonProps = {
  region: AdminRegion;
};

export type BalanceCoverageModalProps = {
  open: boolean;
  region: AdminRegion;
  onClose: () => void;
};

export type BalanceCoverageDialogProps = Omit<BalanceCoverageModalProps, "open">;

export type BalanceCoverageResultProps = {
  result: BalanceCoverageSpareResult;
};

export type AdminOverviewRegionTabsProps = {
  region: AdminRegion;
  children: ReactNode;
};

export type AdminCountryCoverageTableProps = {
  rows: AdminCountryCoverageRow[];
  totals: AdminCountryCoverageTotals;
  showAlphaaPlatforms?: boolean;
};

export type AdminCountryCoverageRowProps = {
  row: AdminCountryCoverageRow;
  showAlphaaPlatforms?: boolean;
};

export type AdminCountryHolderGapRowProps = {
  holder: AdminCountryCoverageHolder;
  country: string;
  showAlphaaPlatforms?: boolean;
};

export type AdminCountryHolderGapsTableProps = {
  country: string;
  holders: AdminCountryCoverageHolder[];
  missingEmployees: number;
  showAlphaaPlatforms?: boolean;
};

export type AlphaaCoveragePlatformColumnsProps = {
  variant: "header" | "footer";
  totals?: AlphaaExtraPlatformCoverage;
};

export type AdminCoverageCountCellProps = {
  count: AdminCoverageCount;
  label: string;
};

export type AdminOverviewAction = {
  href: string;
  ariaLabel: string;
  icon: "userPlus" | "users" | "extract" | "strategy";
  variant: "primary" | "secondary";
};

export type EmployeeActivityItem = {
  kind: string;
  created_at: string;
  description: string;
};

export type AdminEmployeeEditorBundle = {
  fullName: string;
  role: Role;
  profile: EmployeeFormInitial;
  teamLeads: AdminTeamLeadOption[];
  managers: AdminManagerOption[];
  ops: AdminSupervisorOption[];
  admins: AdminSupervisorOption[];
  targets: UpdateEmployeeTargetsPayload;
  activeCounts: Record<string, number>;
  activity: EmployeeActivityItem[];
};

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  tone?: "default" | "danger";
};

export type EmployeeFormProps = {
  initial: EmployeeFormInitial;
  teamLeads: AdminTeamLeadOption[];
  managers: AdminManagerOption[];
  ops: AdminSupervisorOption[];
  admins: AdminSupervisorOption[];
  embedded?: boolean;
  onSaved?: () => void;
  employmentStatusLocked?: boolean;
};

export type EmployeeTargetsFormProps = {
  userId: number;
  initial: UpdateEmployeeTargetsPayload;
  activeCounts: Record<string, number>;
  embedded?: boolean;
  onSaved?: () => void;
};

export type EmployeeTableRowProps = {
  row: AdminEmployeeListRow;
  holders: BulkImportHolderOption[];
};

export type EmployeesTableProps = {
  rows: AdminEmployeeListRow[];
  holders: BulkImportHolderOption[];
};

export type EmployeeCountryCellProps = {
  countries: string[];
};

export type AccountTotalsCellProps = {
  added: number;
  assigned: number;
};

export type CountryFilterSelectProps = {
  value: string;
  onChange: (country: string) => void;
  countries?: readonly string[];
};

export type AdminCountrySelectProps = {
  value: string;
  onChange: (country: string) => void;
  countries?: readonly string[];
  disabled?: boolean;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  invalid?: boolean;
};

export type EmployeesSearchFormProps = {
  initialQ: string;
  hiddenStatus?: string;
  hiddenRole?: string;
  hiddenRegion?: string;
  hiddenCountry?: string;
};

export type EmployeeStatusSelectProps = {
  userId: number;
  fullName: string;
  status: EmploymentStatus;
  source?: AdminEmployeeSource;
};

export type EmployeeActiveToggleProps = {
  userId: number;
  fullName: string;
  isActive: boolean;
  source?: AdminEmployeeSource;
};

export type EmployeeStatusBadgeProps = {
  status: EmploymentStatus;
};

export type EmployeeViewButtonProps = {
  employeeId: number;
  fullName: string;
  role: Role;
};

export type AlphaaEmployeeViewLinkProps = {
  employeeId: number;
  fullName: string;
};

export type EmployeeCodeButtonProps = {
  employeeId: number;
  fullName: string;
  employeeCode: string | null;
};

export type AdminEmployeeCodeModalProps = {
  open: boolean;
  employeeId: number;
  fullName: string;
  employeeCode: string | null;
  onClose: () => void;
};

export type EmployeeEditModalProps = {
  userId: number;
  fullName: string;
  role: Role;
  open: boolean;
  onClose: () => void;
  bundle: AdminEmployeeEditorBundle | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
};

export type EmployeeEditModalTabsProps = {
  panel: AdminEmployeePanel;
  onChange: (panel: AdminEmployeePanel) => void;
};

export type EmployeeDeleteButtonProps = {
  userId: number;
  fullName: string;
  source?: AdminEmployeeSource;
};

export type AdminEmployeeActivityListProps = {
  items: EmployeeActivityItem[];
};

export type AdminSocialAccountListItem = {
  id: number;
  /** Temp Platform key, or a normalized ALPHAA extra/raw platform key. */
  platform: string;
  account_name: string;
  account_handle: string | null;
  account_url: string | null;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  account_scope: AccountScope;
  status: "active" | "archived" | "suspended";
  is_spare: boolean;
};

export type AdminSpareAccountListItem = {
  id: number;
  source: AdminEmployeeSource;
  /** Temp Platform key, or a normalized ALPHAA extra/raw platform key. */
  platform: string;
  username: string | null;
  account_name: string;
  account_url: string | null;
  category: string | null;
  status: AdminSocialAccountListItem["status"];
  handler_id: number;
  handler_name: string;
  country: string | null;
  region: string | null;
};

export type SpareMarkHolderOption = {
  id: number;
  source: AdminEmployeeSource;
  full_name: string;
  country: string | null;
  region: string | null;
};

export type AccountHolderOption = {
  id: number;
  full_name: string;
  country: string;
};

export type AdminSocialAccountInput = {
  platform: Platform;
  accountScope?: AccountScope;
  accountHolder: string;
  holderUserId?: number;
  url: string;
  category: string;
  username: string;
  email: string;
  accountPassword: string;
  emailPassword: string;
  mobileNumber: string;
  status?: "active" | "archived" | "suspended";
};

export type AdminAccountMutationResult = { error?: string };

export type EmployeeAccountsPanelProps = {
  userId: number;
  fullName: string;
  country: string | null;
  language: string | null;
  accounts: AdminSocialAccountListItem[];
  assignedCount: number;
  canAdd: boolean;
  canImport?: boolean;
  canMarkSpare?: boolean;
  readOnly?: boolean;
  holders: BulkImportHolderOption[];
  holderSource?: AdminEmployeeSource;
  onChanged?: () => void;
};

export type EmployeeAccountsTableProps = {
  userId: number;
  fullName: string;
  accounts: AdminSocialAccountListItem[];
  canMarkSpare?: boolean;
  onChanged?: () => void;
  readOnly?: boolean;
  source?: AdminEmployeeSource;
};

export type AccountRowProps = {
  holderId: number;
  holderName: string;
  account: AdminSocialAccountListItem;
  canMarkSpare?: boolean;
  onChanged?: () => void;
  readOnly?: boolean;
  source?: AdminEmployeeSource;
};

export type AccountSpareToggleButtonProps = {
  accountId: number;
  accountName: string;
  isSpare: boolean;
  onChanged?: () => void;
  source?: AdminEmployeeSource;
};

export type SpareAccountsModalProps = {
  open: boolean;
  onClose: () => void;
  accounts: AdminSpareAccountListItem[];
  holders: SpareMarkHolderOption[];
};

export type SpareAccountsDialogProps = Omit<SpareAccountsModalProps, "open">;

export type SpareAccountsButtonProps = {
  accounts: AdminSpareAccountListItem[];
  holders: SpareMarkHolderOption[];
};

export type SpareAccountsListProps = {
  accounts: AdminSpareAccountListItem[];
  pendingKey: string | null;
  pending: boolean;
  onUnmark: (account: AdminSpareAccountListItem) => void;
};

export type SpareAccountsMarkPanelProps = {
  holders: SpareMarkHolderOption[];
  onSpareChange: (item: AdminSpareAccountListItem, isSpare: boolean) => void;
};

export type SpareModalTab = "spare" | "mark";

export type AccountHolderSelectProps = {
  value: AdminSocialAccountInput;
  options: AccountHolderOption[];
  error?: string;
  onChange: (patch: Partial<AdminSocialAccountInput>) => void;
};

export type AccountFormFieldsProps = {
  value: AdminSocialAccountInput;
  fieldErrors: Partial<Record<keyof AdminSocialAccountInput, string>>;
  platformLocked?: boolean;
  showAccountScope?: boolean;
  hideEmailPassword?: boolean;
  holderOptions?: AccountHolderOption[];
  onChange: (patch: Partial<AdminSocialAccountInput>) => void;
};

export type AccountEditModalProps = {
  open: boolean;
  mode: "create" | "edit";
  holderId: number;
  holderName: string;
  initial: AdminSocialAccountInput;
  accountId?: number;
  holderOptions?: AccountHolderOption[];
  source?: AdminEmployeeSource;
  onClose: () => void;
  onSaved?: () => void;
  save?: (
    payload: AdminSocialAccountInput
  ) => Promise<AdminAccountMutationResult>;
};

export type AccountDeleteButtonProps = {
  accountId: number;
  accountName: string;
  onDeleted?: () => void;
  source?: AdminEmployeeSource;
};

export type AccountSpareBadgeProps = {
  isSpare: boolean;
};

export type AccountCategoryBadgeProps = {
  category: string | null;
};

export type AccountStatusBadgeProps = {
  status: AdminSocialAccountListItem["status"];
};

export type AccountUrlCellProps = {
  url: string | null;
  label: string;
};

export type BulkImportHolderOption = {
  id: number;
  source: "temp" | "alphaa";
  full_name: string;
  country: string | null;
  language: string | null;
  team_lead_name: string | null;
  manager_name: string | null;
};

export type BulkImportSelectedEmployeeProps = {
  holder: BulkImportHolderOption;
};

export type EmployeeReporting = {
  teamLeadName: string | null;
  managerName: string | null;
};

export type EmployeeReportingResponse =
  | { ok: true; reporting: EmployeeReporting }
  | { ok: false; error: string };

export type UseEmployeeReportingResult = {
  reporting: EmployeeReporting | null;
  loading: boolean;
};

export type EmployeeAccountsResponse =
  | { ok: true; accounts: AdminSocialAccountListItem[] }
  | { ok: false; error: string };

export type UseEmployeeAccountsResult = {
  accounts: AdminSocialAccountListItem[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export type EmployeeAccountsFetch = {
  key: string;
  accounts: AdminSocialAccountListItem[];
  error: string | null;
};

export type BulkImportAccountDraft = {
  id: string;
  platform: Platform | "";
  accountHolder: string;
  url: string;
  category: string;
  username: string;
  email: string;
  accountPassword: string;
  emailPassword: string;
  mobileNumber: string;
  status: "active" | "archived" | "suspended";
};

export type BulkImportParseResult = {
  language: string;
  warnings: string[];
  rows: BulkImportAccountDraft[];
};

export type BulkImportParseSuccess = BulkImportParseResult;
export type BulkImportMutationResult =
  | { error: string }
  | BulkImportParseResult
  | { imported: number };

export type EmployeesBulkImportButtonProps = {
  holders: BulkImportHolderOption[];
  initialHolderId?: number;
  initialHolderSource?: "temp" | "alphaa";
  variant?: "icon" | "button";
};

export type BulkImportModalProps = {
  open: boolean;
  holders: BulkImportHolderOption[];
  initialHolderId?: number;
  initialHolderSource?: "temp" | "alphaa";
  onClose: () => void;
};

export type BulkImportHolderStepProps = {
  holders: BulkImportHolderOption[];
  holderId: string;
  region: "" | SetupRegion;
  country: string;
  onHolderIdChange: (holderId: string) => void;
  onRegionChange: (region: "" | SetupRegion) => void;
  onCountryChange: (country: string) => void;
};

export type BulkImportUploadStepProps = {
  fileName: string | null;
  error: string | null;
  pending: boolean;
  onFile: (file: File) => void;
};

export type BulkImportReviewTableProps = {
  holderName: string;
  country: string;
  region: string;
  language: string;
  rows: BulkImportAccountDraft[];
  rowFieldErrors?: Record<string, Record<string, string>>;
  strict?: boolean;
  onLanguageChange: (language: string) => void;
  onRowChange: (id: string, patch: Partial<BulkImportAccountDraft>) => void;
  onRemoveRow: (id: string) => void;
  onAddRow: () => void;
};

export type BulkImportReviewRowProps = {
  row: BulkImportAccountDraft;
  fieldErrors?: Record<string, string>;
  strict?: boolean;
  onChange: (patch: Partial<BulkImportAccountDraft>) => void;
  onRemove: () => void;
};

export type SheetsExportAccountRow = {
  region: string | null;
  country: string | null;
  language: string | null;
  handler_name: string;
  platform: Platform;
  account_scope: AccountScope;
  account_name: string;
  account_handle: string | null;
  account_url: string | null;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  mobile_number: string | null;
  status: "active" | "archived" | "suspended";
};

export type AlphaaSheetsExportFlag = boolean | string | null;

/** Row shape from the legacy social_media_accounts table (ALPHAA sheet export). */
export type AlphaaSheetsExportAccountRow = {
  region: string | null;
  country: string | null;
  platform: string | null;
  direction: string | null;
  acc_name: string | null;
  acc_bio: string | null;
  acc_url: string | null;
  personal: AlphaaSheetsExportFlag;
  umberlla: AlphaaSheetsExportFlag;
  native: AlphaaSheetsExportFlag;
  blogs: AlphaaSheetsExportFlag;
  golden: AlphaaSheetsExportFlag;
  acc_state: string | null;
  language1: string | null;
  language2: string | null;
  handler_name: string | null;
  acc_username: string | null;
  acc_email: string | null;
  acc_password_hash: string | null;
  acc_mobile: string | null;
  rss: string | null;
  dropbox: string | null;
};

export type SheetsSyncResult = {
  success: boolean;
  message: string;
  count?: number;
  africaCount?: number;
  europeCount?: number;
  /** @deprecated Use europeCount */
  balkanCount?: number;
  alphaaCount?: number;
};

export type SyncSheetsButtonProps = {
  variant?: "icon" | "button";
  ariaLabel?: string;
  title?: string;
  label?: string;
};

/** Admin data extract tool — filter Africa/Europe temp + ALPHAA legacy accounts. */
export type AdminExtractRegionFilter = "all" | "Africa" | "Europe" | "Alphaa";

export type AdminExtractSpareFilter = "exclude" | "include" | "only";

export type AdminExtractStatusFilter =
  | "active"
  | "all"
  | "archived"
  | "suspended";

export type AdminExtractFilters = {
  region: AdminExtractRegionFilter;
  countries: string[];
  /** Temp Platform keys and/or AlphaaExtraPlatformKey values. */
  platforms: string[];
  scopes: AccountScope[];
  status: AdminExtractStatusFilter;
  spare: AdminExtractSpareFilter;
};

export type AdminExtractRow = {
  id: number;
  source: "temp" | "alphaa";
  region: string | null;
  country: string | null;
  handler_name: string;
  /** Normalized platform key (temp Platform or Alphaa extra / raw label). */
  platform: string;
  account_scope: AccountScope;
  username: string | null;
  account_name: string;
  account_url: string | null;
  category: string | null;
  status: "active" | "archived" | "suspended";
  is_spare: boolean;
};

export type AdminExtractBucketCount = {
  key: string;
  label: string;
  count: number;
};

export type AdminExtractSummary = {
  total: number;
  byRegion: AdminExtractBucketCount[];
  byCountry: AdminExtractBucketCount[];
  byPlatform: AdminExtractBucketCount[];
  byScope: AdminExtractBucketCount[];
};

export type AdminExtractResult = {
  rows: AdminExtractRow[];
  summary: AdminExtractSummary;
};

export type ExtractToolProps = {
  countries: string[];
};

export type ExtractFiltersProps = {
  value: AdminExtractFilters;
  countries: string[];
  onChange: (next: AdminExtractFilters) => void;
};

export type ExtractSummaryProps = {
  summary: AdminExtractSummary | null;
};

export type ExtractPreviewTableProps = {
  rows: AdminExtractRow[];
};

export type ExtractExportButtonProps = {
  rows: AdminExtractRow[];
  disabled?: boolean;
};
