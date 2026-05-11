import { query, queryOne } from "@/lib/db";
import { PLATFORMS, type Platform } from "@/lib/platform-config";
import { computeWallet } from "@/lib/wallet";
import type { DashboardData, PlatformDailyStatus } from "@/types/dashboard";
import type { TempGrowth, TempSocialMediaAccount, TempUser } from "@/types/db";

const CAIRO_TIME_ZONE = "Africa/Cairo";

function emptyAccountsByPlatform(): Record<Platform, TempSocialMediaAccount[]> {
  return {
    x: [],
    facebook_personal: [],
    facebook_umbrella: [],
    instagram: [],
    tiktok: [],
  };
}

function emptyPlatformStatus(): Record<Platform, PlatformDailyStatus> {
  return {
    x: { totalAccounts: 0, submittedAccounts: 0, autoResetAccounts: 0, lastSubmittedAt: null },
    facebook_personal: {
      totalAccounts: 0,
      submittedAccounts: 0,
      autoResetAccounts: 0,
      lastSubmittedAt: null,
    },
    facebook_umbrella: {
      totalAccounts: 0,
      submittedAccounts: 0,
      autoResetAccounts: 0,
      lastSubmittedAt: null,
    },
    instagram: {
      totalAccounts: 0,
      submittedAccounts: 0,
      autoResetAccounts: 0,
      lastSubmittedAt: null,
    },
    tiktok: { totalAccounts: 0, submittedAccounts: 0, autoResetAccounts: 0, lastSubmittedAt: null },
  };
}

function getCairoDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function getTodayCairoDate() {
  const { year, month, day } = getCairoDateParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getCairoDateParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - date.getTime();
}

function getUtcTimestampForCairoMidnight(year: number, month: number, day: number) {
  const localMidnightAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let guess = localMidnightAsUtc - getTimeZoneOffsetMs(new Date(localMidnightAsUtc));
  guess = localMidnightAsUtc - getTimeZoneOffsetMs(new Date(guess));
  return guess;
}

function getWindowClosesInMs(now = new Date()) {
  const { year, month, day } = getCairoDateParts(now);
  const nextMidnightUtc = getUtcTimestampForCairoMidnight(year, month, day + 1);
  return Math.max(0, nextMidnightUtc - now.getTime());
}

function targetsFromUser(user: TempUser): Record<Platform, number> {
  return {
    x: user.target_x_count,
    facebook_personal: user.target_facebook_personal_count,
    facebook_umbrella: user.target_facebook_umbrella_count,
    instagram: user.target_instagram_count,
    tiktok: user.target_tiktok_count,
  };
}

function groupAccounts(accounts: TempSocialMediaAccount[]) {
  const grouped = emptyAccountsByPlatform();
  for (const account of accounts) grouped[account.platform].push(account);
  return grouped;
}

function groupSubmissions(submissions: TempGrowth[]) {
  const grouped: Record<number, TempGrowth> = {};
  for (const submission of submissions) {
    grouped[submission.social_media_account_id] = submission;
  }
  return grouped;
}

function buildPlatformStatus(
  accountsByPlatform: Record<Platform, TempSocialMediaAccount[]>,
  submissionsByAccountId: Record<number, TempGrowth>
) {
  const status = emptyPlatformStatus();

  for (const platform of PLATFORMS) {
    const accounts = accountsByPlatform[platform];
    let submittedAccounts = 0;
    let autoResetAccounts = 0;
    let lastSubmittedAt: string | null = null;

    for (const account of accounts) {
      const submission = submissionsByAccountId[account.id];
      if (!submission) continue;

      if (submission.is_auto_reset) {
        autoResetAccounts += 1;
        continue;
      }

      if (submission.submitted_at) {
        submittedAccounts += 1;
        if (!lastSubmittedAt || submission.submitted_at > lastSubmittedAt) {
          lastSubmittedAt = submission.submitted_at;
        }
      }
    }

    status[platform] = {
      totalAccounts: accounts.length,
      submittedAccounts,
      autoResetAccounts,
      lastSubmittedAt,
    };
  }

  return status;
}

function buildMissingAccounts(
  user: TempUser,
  accountsByPlatform: Record<Platform, TempSocialMediaAccount[]>
) {
  const targets = targetsFromUser(user);
  const missing: Partial<Record<Platform, number>> = {};

  for (const platform of PLATFORMS) {
    const count = Math.max(0, targets[platform] - accountsByPlatform[platform].length);
    if (count > 0) missing[platform] = count;
  }

  return missing;
}

function toIsoString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function toNullableIsoString(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeAccount(account: TempSocialMediaAccount): TempSocialMediaAccount {
  return {
    ...account,
    created_at: toIsoString(account.created_at),
    updated_at: toIsoString(account.updated_at),
  };
}

function normalizeSubmission(submission: TempGrowth): TempGrowth {
  return {
    ...submission,
    submission_date: toIsoString(submission.submission_date).slice(0, 10),
    submitted_at: toNullableIsoString(submission.submitted_at),
    qc_reviewed_at: toNullableIsoString(submission.qc_reviewed_at),
    created_at: toIsoString(submission.created_at),
    updated_at: toIsoString(submission.updated_at),
  };
}

export async function getDashboardData(userId: number): Promise<DashboardData | null> {
  const todayCairoDate = getTodayCairoDate();

  const user = await queryOne<TempUser>(
    `SELECT *
     FROM temp_users
     WHERE id = $1 AND is_active = TRUE`,
    [userId]
  );

  if (!user) return null;

  const [accounts, todaysSubmissions, wallet] = await Promise.all([
    query<TempSocialMediaAccount>(
      `SELECT *
       FROM temp_social_media_accounts
       WHERE user_id = $1 AND status = 'active'
       ORDER BY platform ASC, id ASC`,
      [userId]
    ),
    query<TempGrowth>(
      `SELECT g.*
       FROM temp_growth g
       INNER JOIN temp_social_media_accounts a
         ON a.id = g.social_media_account_id
       WHERE g.user_id = $1
         AND g.submission_date = $2::date
         AND a.status = 'active'
       ORDER BY g.submitted_at DESC NULLS LAST, g.id DESC`,
      [userId, todayCairoDate]
    ),
    computeWallet(user),
  ]);

  const normalizedAccounts = accounts.map(normalizeAccount);
  const normalizedSubmissions = todaysSubmissions.map(normalizeSubmission);
  const accountsByPlatform = groupAccounts(normalizedAccounts);
  const todaysSubmissionsByAccountId = groupSubmissions(normalizedSubmissions);

  return {
    user,
    accountsByPlatform,
    todaysSubmissionsByAccountId,
    platformStatus: buildPlatformStatus(accountsByPlatform, todaysSubmissionsByAccountId),
    missingAccounts: buildMissingAccounts(user, accountsByPlatform),
    wallet,
    windowClosesInMs: getWindowClosesInMs(),
    todayCairoDate,
  };
}
