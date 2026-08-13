import type { Platform } from "@/lib/platform-config";
import type { TempSocialMediaAccount } from "@/types/db";
import type {
  SETUP_CATEGORIES,
  SETUP_COUNTRIES,
  SETUP_LANGUAGES,
} from "@/lib/setup-options";

export type SetupCountry = (typeof SETUP_COUNTRIES)[number];
export type SetupCategory = (typeof SETUP_CATEGORIES)[number];
export type SetupLanguage = (typeof SETUP_LANGUAGES)[number];

export type SetupAccountField =
  | "accountHolder"
  | "url"
  | "category"
  | "username"
  | "email"
  | "accountPassword"
  | "emailPassword"
  | "mobileNumber";

export type SetupAccountRow = {
  id: string;
  accountHolder: string;
  url: string;
  category: string;
  username: string;
  email: string;
  accountPassword: string;
  emailPassword: string;
  mobileNumber: string;
};

export type SetupProfile = {
  country: string;
  language: string;
};

export type SetupAccountFieldErrors = Partial<Record<SetupAccountField, string>>;
export type SetupRowFieldErrors = Record<string, SetupAccountFieldErrors>;
export type SetupProfileFieldErrors = Partial<
  Record<"country" | "language", string>
>;

/** @deprecated Prefer SetupRowFieldErrors for per-input borders */
export type SetupRowErrors = Record<string, string>;

export type SetupFormProps = {
  userId: number;
  fullName: string;
  targets: Record<Platform, number>;
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>;
  initialProfile: SetupProfile;
};

export type SetupProfileFieldsProps = {
  country: string;
  language: string;
  fieldErrors?: SetupProfileFieldErrors;
  onChange: (patch: Partial<SetupProfile>) => void;
};

export type SetupSelectProps = {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  ariaLabel: string;
  ariaInvalid?: boolean;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export type SetupAccountRowFieldsProps = {
  platform: Platform;
  platformLabel: string;
  row: SetupAccountRow;
  index: number;
  fieldErrors?: SetupAccountFieldErrors;
  canRemove: boolean;
  onChange: (patch: Partial<SetupAccountRow>) => void;
  onRemove: () => void;
};

export type SetupTextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  ariaLabel: string;
  ariaInvalid?: boolean;
  error?: string;
  describedBy?: string;
  type?: "text" | "email" | "password" | "tel";
  inputMode?: "text" | "email" | "numeric" | "tel";
  autoComplete?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export type SetupSaveAccountInput = {
  platform: Platform;
  accountHolder: string;
  url: string;
  category: string;
  username: string;
  email: string;
  accountPassword: string;
  emailPassword: string;
  mobileNumber: string;
};

export type SetupSavePayload = {
  country: string;
  language: string;
  accounts: SetupSaveAccountInput[];
};

export type SetupCancelButtonProps = {
  disabled?: boolean;
};

export type ScrollToFirstSetupErrorProps = {
  token: number;
};

export type SetupStepId =
  | "profile"
  | "facebook"
  | "x"
  | "instagram"
  | "tiktok";

export type SetupStep = {
  id: SetupStepId;
  label: string;
};

export type SetupStepNavProps = {
  steps: SetupStep[];
  currentIndex: number;
};
