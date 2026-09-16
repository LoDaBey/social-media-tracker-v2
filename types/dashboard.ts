import type { Platform, TempGrowth, TempSocialMediaAccount, TempUser } from "@/types/db";
export type PlatformDailyStatus = {
  totalAccounts: number;
  submittedAccounts: number;
  autoResetAccounts: number;
  lastSubmittedAt: string | null;
};

export type DashboardData = {
  user: TempUser;
  accountsByPlatform: Record<Platform, TempSocialMediaAccount[]>;
  todaysSubmissionsByAccountId: Record<number, TempGrowth>;
  platformStatus: Record<Platform, PlatformDailyStatus>;
  missingAccounts: Partial<Record<Platform, number>>;
  windowClosesInMs: number;
  todayCairoDate: string;
};

export type PlatformRowProps = {
  platform: Platform;
  accounts: TempSocialMediaAccount[];
  status: PlatformDailyStatus;
  onSubmitPlatform?: (platform: Platform) => void;
  justSubmitted?: boolean;
};

export type DashboardRowsClientProps = {
  accountPlatforms: Platform[];
  accountsByPlatform: Record<Platform, TempSocialMediaAccount[]>;
  todaysSubmissionsByAccountId: Record<number, TempGrowth>;
  platformStatus: Record<Platform, PlatformDailyStatus>;
  initialJustSubmitted?: Platform | null;
};
