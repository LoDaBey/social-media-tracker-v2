import type { Platform, Role, EmploymentStatus } from "@/types/db";
import type { ReactNode } from "react";
import type { WalletSummary, WalletTransactionListRow } from "@/types/wallet";

export type AdminEmployeeCycleStatus = "pending" | "mid-cycle" | "payable";

export type AdminEmployeeListRow = {
  id: number;
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
  country: string | null;
  language: string | null;
  countries: string[];
  current_level: number;
  target_accounts_sum: number;
  cycle_status: AdminEmployeeCycleStatus;
  accounts: AdminSocialAccountListItem[];
};

export type AdminPayoutRow = {
  id: number;
  full_name: string;
  email: string;
  net_balance: number;
  days_to_payout: number;
  status: "Mid-cycle" | "Ready to pay" | "Overdue";
};

export type CreateEmployeePayload = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
  role?: Role;
  team_lead_id?: number | null;
  manager_id?: number | null;
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
  manager_id: string;
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
  | "payouts";

export type AdminEmployeePanel = "profile" | "targets" | "wallet" | "activity";

export type AdminView =
  | { kind: "overview"; title: string }
  | { kind: "employees"; title: string }
  | { kind: "employee_new"; title: string }
  | {
      kind: "employee";
      title: string;
      employeeId: number;
      employeeName: string;
      roleBadge: string;
      panel: AdminEmployeePanel;
    }
  | { kind: "payouts"; title: string };

export type AdminWorkspaceProps = {
  view: AdminView;
  children: ReactNode;
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
  manager_countries: string[];
  base_salary: string;
  current_level: number;
  pay_cycle_start_date: string | null;
  country: string;
  /** Bumps when the user row changes so the parent can reset client form state via `key`. */
  updated_at: string;
};

export type AdminTeamLeadOption = {
  id: number;
  full_name: string;
};

export type AdminManagerOption = {
  id: number;
  full_name: string;
  countries: string[];
};

export type AdminKpiTileProps = {
  title: string;
  value: string;
  icon: "users" | "clipboard" | "wallet" | "refresh" | "globe" | "layers";
  subtitle?: string;
};

export type AdminCountrySeatQuota = {
  x: number;
  facebookPersonal: number;
  facebookUmbrella: number;
  instagram: number;
  tiktok: number;
  totalAccounts: number;
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
};

export type AdminCoverageCount = {
  actual: number;
  target: number;
};

export type AdminCountryCoverageHolder = {
  id: number | null;
  fullName: string;
  email: string | null;
  vacant: boolean;
  x: AdminCoverageCount;
  facebookPersonal: AdminCoverageCount;
  facebookUmbrella: AdminCoverageCount;
  instagram: AdminCoverageCount;
  tiktok: AdminCoverageCount;
  totalAccounts: AdminCoverageCount;
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
  holders: AdminCountryCoverageHolder[];
};

export type AdminCountryCoverageTotals = Omit<
  AdminCountryCoverageRow,
  "country" | "language" | "onPlan" | "holders"
>;

export type AdminCountryCoverage = {
  rows: AdminCountryCoverageRow[];
  totals: AdminCountryCoverageTotals;
};

export type AdminCoverageKpisProps = {
  coverage: AdminCountryCoverage;
};

export type AdminCountryCoverageSectionProps = {
  coverage: AdminCountryCoverage;
};

export type AdminCountryCoverageTableProps = {
  rows: AdminCountryCoverageRow[];
  totals: AdminCountryCoverageTotals;
};

export type AdminCountryCoverageRowProps = {
  row: AdminCountryCoverageRow;
};

export type AdminCountryHolderGapRowProps = {
  holder: AdminCountryCoverageHolder;
  country: string;
};

export type AdminCountryHolderGapsTableProps = {
  country: string;
  holders: AdminCountryCoverageHolder[];
  missingEmployees: number;
};

export type AdminCoverageCountCellProps = {
  count: AdminCoverageCount;
  label: string;
};

export type AdminOverviewAction = {
  href: string;
  ariaLabel: string;
  icon: "userPlus" | "users" | "banknote";
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
  targets: UpdateEmployeeTargetsPayload;
  activeCounts: Record<string, number>;
  wallet: WalletSummary;
  transactions: WalletTransactionListRow[];
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
};

export type EmployeesSearchFormProps = {
  initialQ: string;
  hiddenStatus?: string;
  hiddenRole?: string;
  hiddenCountry?: string;
};

export type EmployeeStatusSelectProps = {
  userId: number;
  fullName: string;
  status: EmploymentStatus;
};

export type EmployeeStatusBadgeProps = {
  status: EmploymentStatus;
};

export type EmployeeViewButtonProps = {
  employeeId: number;
  fullName: string;
  role: Role;
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
};

export type AdminEmployeeWalletViewProps = {
  userId: number;
  fullName: string;
  wallet: WalletSummary;
  transactions: WalletTransactionListRow[];
  onWalletChanged?: () => void;
};

export type AdminEmployeeActivityListProps = {
  items: EmployeeActivityItem[];
};

export type IssueBonusFormProps = {
  userId: number;
  onSuccess?: () => void;
};

export type ProcessPayoutBarProps = {
  userId: number;
  daysToPayout: number;
  canForce: boolean;
  onSuccess?: () => void;
};

export type AdminSocialAccountListItem = {
  id: number;
  platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string | null;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  status: "active" | "archived" | "suspended";
};

export type AccountHolderOption = {
  id: number;
  full_name: string;
  country: string;
};

export type AdminSocialAccountInput = {
  platform: Platform;
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
  holders: BulkImportHolderOption[];
  onChanged?: () => void;
};

export type EmployeeAccountsTableProps = {
  userId: number;
  fullName: string;
  accounts: AdminSocialAccountListItem[];
  onChanged?: () => void;
  readOnly?: boolean;
};

export type AccountRowProps = {
  holderId: number;
  holderName: string;
  account: AdminSocialAccountListItem;
  onChanged?: () => void;
  readOnly?: boolean;
};

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
  full_name: string;
  country: string | null;
  language: string | null;
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
  variant?: "icon" | "button";
};

export type BulkImportModalProps = {
  open: boolean;
  holders: BulkImportHolderOption[];
  initialHolderId?: number;
  onClose: () => void;
};

export type BulkImportHolderStepProps = {
  holders: BulkImportHolderOption[];
  holderId: string;
  country: string;
  onHolderIdChange: (holderId: string) => void;
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
