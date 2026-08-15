import type { Platform, Role } from "@/types/db";
import type { ReactNode } from "react";
import type { WalletSummary, WalletTransactionListRow } from "@/types/wallet";

export type AdminEmployeeCycleStatus = "pending" | "mid-cycle" | "payable";

export type AdminEmployeeListRow = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  team_lead_id: number | null;
  team_lead_name: string | null;
  manager_id: number | null;
  manager_name: string | null;
  country: string | null;
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
  icon: "users" | "clipboard" | "wallet" | "refresh";
  subtitle?: string;
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
};

export type EmployeesTableProps = {
  rows: AdminEmployeeListRow[];
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

export type EmployeeViewButtonProps = {
  employeeId: number;
  fullName: string;
  role: Role;
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
  account_url: string;
  category: string | null;
  username: string | null;
  account_email: string | null;
  account_password: string | null;
  email_password: string | null;
  mobile_number: string | null;
  status: "active" | "archived" | "suspended";
};

export type AdminSocialAccountInput = {
  platform: Platform;
  accountHolder: string;
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
  accounts: AdminSocialAccountListItem[];
  assignedCount: number;
  canAdd: boolean;
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

export type AccountFormFieldsProps = {
  value: AdminSocialAccountInput;
  fieldErrors: Partial<Record<keyof AdminSocialAccountInput, string>>;
  platformLocked?: boolean;
  onChange: (patch: Partial<AdminSocialAccountInput>) => void;
};

export type AccountEditModalProps = {
  open: boolean;
  mode: "create" | "edit";
  holderId: number;
  holderName: string;
  initial: AdminSocialAccountInput;
  accountId?: number;
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
  url: string;
  label: string;
};
