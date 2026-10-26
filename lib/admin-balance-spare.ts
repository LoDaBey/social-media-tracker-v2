import { normalizeAlphaaPlatformKey } from "@/lib/admin-extract-alphaa-data";
import { extractPlatformLabel } from "@/lib/admin-extract-platform";
import {
  ALPHAA_EXTRA_PLATFORM_KEYS,
} from "@/lib/alphaa-coverage-platforms";
import { splitAlphaaCountryPlanSeats } from "@/lib/alphaa-country-targets";
import {
  splitCountryPlanSeats,
  xPlanTarget,
} from "@/lib/admin-country-targets";
import {
  ALPHAA_LEGACY_ACTIVE_WHERE,
  ALPHAA_LEGACY_COUNTRY,
} from "@/lib/alphaa-platform-sql";
import { pool, query } from "@/lib/db";
import {
  baseCountryFromDisplay,
  isDualRegionCountry,
  overviewDisplayCountry,
} from "@/lib/overview-country-display";
import { adminCountryPlansForRegion } from "@/lib/strategy-plans-data";
import { TEMP_USER_COUNTRY } from "@/lib/temp-country-sql";
import type {
  AdminCountryPlan,
  AdminCountrySeatQuota,
  AdminEmployeeSource,
  AdminRegion,
  AlphaaExtraPlatformKey,
  BalanceCoverageSpareChange,
  BalanceCoverageSpareGap,
  BalanceCoverageSpareResult,
} from "@/types/admin";

const CORE_PLATFORMS = [
  "x",
  "facebook_personal",
  "facebook_umbrella",
  "instagram",
  "tiktok",
] as const;

const EMPTY_SEAT: AdminCountrySeatQuota = {
  x: 0,
  facebookPersonal: 0,
  facebookUmbrella: 0,
  instagram: 0,
  tiktok: 0,
  totalAccounts: 0,
};

type BalanceAccount = {
  id: number;
  source: AdminEmployeeSource;
  userId: number;
  handlerName: string;
  country: string;
  platform: string;
  isSpare: boolean;
  username: string | null;
};

type AlphaaBalanceRow = {
  id: number;
  user_id: number;
  handler_name: string;
  country: string;
  is_spare: boolean;
  username: string | null;
  platform: string | null;
  personal: boolean | null;
  umberlla: boolean | null;
};

type TempBalanceRow = {
  id: number;
  user_id: number;
  handler_name: string;
  country: string;
  is_spare: boolean;
  username: string | null;
  platform: string;
  target_x_count: number;
  target_facebook_personal_count: number;
  target_facebook_umbrella_count: number;
  target_instagram_count: number;
  target_tiktok_count: number;
};

function isAlphaaPlan(plan: AdminCountryPlan) {
  return plan.extraPlatforms !== undefined;
}

function displayCountry(
  country: string,
  source: AdminEmployeeSource,
  region: AdminRegion
) {
  const base = country.trim() || "Unassigned";
  if (region === "Overview" && isDualRegionCountry(base)) {
    return overviewDisplayCountry(
      base,
      source === "alphaa" ? "Alphaa" : "Africa"
    );
  }
  return base;
}

function planPlatformTargets(plan: AdminCountryPlan) {
  const targets = new Map<string, number>();
  targets.set("x", xPlanTarget(plan));
  targets.set("facebook_personal", plan.facebookPersonal);
  targets.set("facebook_umbrella", plan.facebookUmbrella);
  targets.set("instagram", plan.instagram);
  targets.set("tiktok", plan.tiktok);
  if (plan.extraPlatforms) {
    for (const key of ALPHAA_EXTRA_PLATFORM_KEYS) {
      targets.set(key, plan.extraPlatforms[key] ?? 0);
    }
  }
  return targets;
}

function seatsForPlan(plan: AdminCountryPlan, peopleCount: number) {
  if (isAlphaaPlan(plan) && plan.handlerSeat) {
    const count = Math.max(plan.resources, peopleCount, 1);
    return Array.from({ length: count }, () => plan.handlerSeat!);
  }
  if (isAlphaaPlan(plan)) return splitAlphaaCountryPlanSeats(plan);
  return splitCountryPlanSeats(plan);
}

function platformTargetFromSeat(seat: AdminCountrySeatQuota, platform: string) {
  switch (platform) {
    case "x":
      return seat.x;
    case "facebook_personal":
      return seat.facebookPersonal;
    case "facebook_umbrella":
      return seat.facebookUmbrella;
    case "instagram":
      return seat.instagram;
    case "tiktok":
      return seat.tiktok;
    default:
      return seat.extraPlatforms?.[platform as AlphaaExtraPlatformKey] ?? 0;
  }
}

function toChange(account: BalanceAccount): BalanceCoverageSpareChange {
  return {
    country: account.country,
    platform: account.platform,
    platformLabel: extractPlatformLabel(account.platform),
    handlerName: account.handlerName,
    accountId: account.id,
    username: account.username,
    source: account.source,
  };
}

function compareHandlers(left: string, right: string) {
  return left.localeCompare(right);
}

async function fetchAlphaaBalanceAccounts(
  countries: string[],
  region: AdminRegion
): Promise<BalanceAccount[]> {
  if (countries.length === 0) return [];
  const rows = await query<AlphaaBalanceRow>(
    `SELECT
        sma.id,
        sma.user_id,
        COALESCE(
          NULLIF(TRIM(u.username), ''),
          'Handler ' || u.id::text
        ) AS handler_name,
        ${ALPHAA_LEGACY_COUNTRY} AS country,
        sma.spare_acc AS is_spare,
        sma.acc_username AS username,
        sma.platform,
        sma.personal,
        sma.umberlla
       FROM social_media_accounts sma
       INNER JOIN users u ON u.id = sma.user_id
      WHERE ${ALPHAA_LEGACY_ACTIVE_WHERE}
        AND ${ALPHAA_LEGACY_COUNTRY} = ANY($1::text[])
      ORDER BY sma.id ASC`,
    [countries]
  );
  return rows.map((row) => ({
    id: row.id,
    source: "alphaa" as const,
    userId: row.user_id,
    handlerName: row.handler_name,
    country: displayCountry(row.country, "alphaa", region),
    platform: normalizeAlphaaPlatformKey(row.platform, row.umberlla),
    isSpare: Boolean(row.is_spare),
    username: row.username,
  }));
}

async function fetchTempBalanceAccounts(
  countries: string[],
  region: AdminRegion
): Promise<{ accounts: BalanceAccount[]; seats: Map<number, AdminCountrySeatQuota> }> {
  if (countries.length === 0) {
    return { accounts: [], seats: new Map() };
  }

  const regionClause =
    region === "Africa"
      ? ` AND LOWER(TRIM(u.region)) = 'africa'`
      : region === "Europe"
        ? ` AND LOWER(TRIM(u.region)) IN ('europe', 'balkan')`
        : ` AND LOWER(TRIM(u.region)) IN ('africa', 'europe', 'balkan')`;

  const rows = await query<TempBalanceRow>(
    `SELECT
        a.id,
        a.user_id,
        u.full_name AS handler_name,
        ${TEMP_USER_COUNTRY} AS country,
        a.is_spare,
        a.username,
        a.platform::text AS platform,
        u.target_x_count,
        u.target_facebook_personal_count,
        u.target_facebook_umbrella_count,
        u.target_instagram_count,
        u.target_tiktok_count
       FROM temp_social_media_accounts a
       INNER JOIN temp_users u ON u.id = a.user_id
      WHERE a.status = 'active'
        AND LOWER(u.role) = 'employee'
        AND u.is_active = TRUE
        ${regionClause}
        AND ${TEMP_USER_COUNTRY} = ANY($1::text[])
      ORDER BY a.id ASC`,
    [countries]
  );

  const seats = new Map<number, AdminCountrySeatQuota>();
  const accounts: BalanceAccount[] = [];
  for (const row of rows) {
    if (!seats.has(row.user_id)) {
      const x = Number(row.target_x_count) || 0;
      const facebookPersonal = Number(row.target_facebook_personal_count) || 0;
      const facebookUmbrella = Number(row.target_facebook_umbrella_count) || 0;
      const instagram = Number(row.target_instagram_count) || 0;
      const tiktok = Number(row.target_tiktok_count) || 0;
      seats.set(row.user_id, {
        x,
        facebookPersonal,
        facebookUmbrella,
        instagram,
        tiktok,
        totalAccounts:
          x + facebookPersonal + facebookUmbrella + instagram + tiktok,
      });
    }
    accounts.push({
      id: row.id,
      source: "temp",
      userId: row.user_id,
      handlerName: row.handler_name,
      country: displayCountry(row.country, "temp", region),
      platform: row.platform,
      isSpare: Boolean(row.is_spare),
      username: row.username,
    });
  }
  return { accounts, seats };
}

function holderSeatsForCountry(
  plan: AdminCountryPlan,
  accounts: BalanceAccount[],
  tempSeats: Map<number, AdminCountrySeatQuota>
) {
  const handlers = new Map<number, string>();
  for (const account of accounts) {
    if (!handlers.has(account.userId)) {
      handlers.set(account.userId, account.handlerName);
    }
  }
  const people = [...handlers.entries()].sort((left, right) =>
    compareHandlers(left[1], right[1])
  );
  const seats = seatsForPlan(plan, people.length);
  const byUser = new Map<number, AdminCountrySeatQuota>();
  people.forEach(([userId], index) => {
    if (!isAlphaaPlan(plan) && tempSeats.has(userId)) {
      byUser.set(userId, tempSeats.get(userId)!);
      return;
    }
    byUser.set(userId, seats[index] ?? EMPTY_SEAT);
  });
  return byUser;
}

function pickForPlatform(
  country: string,
  platform: string,
  target: number,
  rows: BalanceAccount[],
  holderSeats: Map<number, AdminCountrySeatQuota>
): {
  mark: BalanceAccount[];
  unmark: BalanceAccount[];
  missing: BalanceCoverageSpareGap | null;
} {
  const live = rows.filter((row) => !row.isSpare);
  const spare = rows.filter((row) => row.isSpare);
  const liveCount = new Map<number, number>();
  for (const row of live) {
    liveCount.set(row.userId, (liveCount.get(row.userId) ?? 0) + 1);
  }

  function overage(userId: number) {
    const seat = holderSeats.get(userId) ?? EMPTY_SEAT;
    return (liveCount.get(userId) ?? 0) - platformTargetFromSeat(seat, platform);
  }

  const mark: BalanceAccount[] = [];
  const unmark: BalanceAccount[] = [];

  if (live.length > target) {
    const remaining = [...live];
    while (mark.length < live.length - target && remaining.length > 0) {
      remaining.sort((left, right) => {
        const overDiff = overage(right.userId) - overage(left.userId);
        if (overDiff !== 0) return overDiff;
        const liveDiff =
          (liveCount.get(right.userId) ?? 0) - (liveCount.get(left.userId) ?? 0);
        if (liveDiff !== 0) return liveDiff;
        return right.id - left.id;
      });
      const next = remaining.shift();
      if (!next) break;
      mark.push(next);
      liveCount.set(next.userId, Math.max(0, (liveCount.get(next.userId) ?? 1) - 1));
    }
    return { mark, unmark, missing: null };
  }

  if (live.length < target) {
    const need = target - live.length;
    const remaining = [...spare];
    while (unmark.length < need && remaining.length > 0) {
      remaining.sort((left, right) => {
        const underDiff = overage(left.userId) - overage(right.userId);
        if (underDiff !== 0) return underDiff;
        return left.id - right.id;
      });
      const next = remaining.shift();
      if (!next) break;
      unmark.push(next);
      liveCount.set(next.userId, (liveCount.get(next.userId) ?? 0) + 1);
    }
    const stillMissing = need - unmark.length;
    if (stillMissing > 0) {
      return {
        mark,
        unmark,
        missing: {
          country,
          platform,
          platformLabel: extractPlatformLabel(platform),
          actual: live.length,
          target,
          missing: stillMissing,
          spareAvailable: spare.length,
        },
      };
    }
  }

  return { mark, unmark, missing: null };
}

export async function computeCoverageSpareBalance(
  region: AdminRegion
): Promise<Omit<BalanceCoverageSpareResult, "applied">> {
  const plans = await adminCountryPlansForRegion(region);
  const alphaaPlans = plans.filter(isAlphaaPlan);
  const tempPlans = plans.filter((plan) => !isAlphaaPlan(plan));
  const alphaaCountries = [
    ...new Set(alphaaPlans.map((plan) => baseCountryFromDisplay(plan.country))),
  ];
  const tempCountries = [
    ...new Set(tempPlans.map((plan) => baseCountryFromDisplay(plan.country))),
  ];

  const [alphaaAccounts, tempBundle] = await Promise.all([
    fetchAlphaaBalanceAccounts(alphaaCountries, region),
    fetchTempBalanceAccounts(tempCountries, region),
  ]);

  const accounts = [...alphaaAccounts, ...tempBundle.accounts];
  const byCountry = new Map<string, BalanceAccount[]>();
  for (const account of accounts) {
    const list = byCountry.get(account.country) ?? [];
    list.push(account);
    byCountry.set(account.country, list);
  }

  const marked: BalanceCoverageSpareChange[] = [];
  const unmarked: BalanceCoverageSpareChange[] = [];
  const missing: BalanceCoverageSpareGap[] = [];

  for (const plan of plans) {
    const countryAccounts = byCountry.get(plan.country) ?? [];
    const holderSeats = holderSeatsForCountry(
      plan,
      countryAccounts,
      tempBundle.seats
    );
    const targets = planPlatformTargets(plan);
    const platforms = new Set<string>([
      ...CORE_PLATFORMS,
      ...targets.keys(),
      ...countryAccounts.map((account) => account.platform),
    ]);

    for (const platform of platforms) {
      const target = targets.get(platform) ?? 0;
      const rows = countryAccounts.filter(
        (account) => account.platform === platform
      );
      if (target <= 0 && rows.filter((row) => !row.isSpare).length === 0) {
        continue;
      }
      const picked = pickForPlatform(
        plan.country,
        platform,
        target,
        rows,
        holderSeats
      );
      marked.push(...picked.mark.map(toChange));
      unmarked.push(...picked.unmark.map(toChange));
      if (picked.missing) missing.push(picked.missing);
    }
  }

  marked.sort(
    (left, right) =>
      left.country.localeCompare(right.country) ||
      left.platformLabel.localeCompare(right.platformLabel) ||
      left.handlerName.localeCompare(right.handlerName)
  );
  unmarked.sort(
    (left, right) =>
      left.country.localeCompare(right.country) ||
      left.platformLabel.localeCompare(right.platformLabel) ||
      left.handlerName.localeCompare(right.handlerName)
  );
  missing.sort(
    (left, right) =>
      left.country.localeCompare(right.country) ||
      left.platformLabel.localeCompare(right.platformLabel)
  );

  return { marked, unmarked, missing };
}

export async function applyCoverageSpareBalance(
  marked: BalanceCoverageSpareChange[],
  unmarked: BalanceCoverageSpareChange[]
) {
  const markAlphaa = marked.filter((row) => row.source === "alphaa").map((row) => row.accountId);
  const markTemp = marked.filter((row) => row.source === "temp").map((row) => row.accountId);
  const unmarkAlphaa = unmarked
    .filter((row) => row.source === "alphaa")
    .map((row) => row.accountId);
  const unmarkTemp = unmarked
    .filter((row) => row.source === "temp")
    .map((row) => row.accountId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (markAlphaa.length > 0) {
      await client.query(
        `UPDATE social_media_accounts
            SET spare_acc = TRUE, updated_at = NOW()
          WHERE id = ANY($1::int[])`,
        [markAlphaa]
      );
    }
    if (unmarkAlphaa.length > 0) {
      await client.query(
        `UPDATE social_media_accounts
            SET spare_acc = FALSE, updated_at = NOW()
          WHERE id = ANY($1::int[])`,
        [unmarkAlphaa]
      );
    }
    if (markTemp.length > 0) {
      await client.query(
        `UPDATE temp_social_media_accounts
            SET is_spare = TRUE
          WHERE id = ANY($1::int[])`,
        [markTemp]
      );
    }
    if (unmarkTemp.length > 0) {
      await client.query(
        `UPDATE temp_social_media_accounts
            SET is_spare = FALSE
          WHERE id = ANY($1::int[])`,
        [unmarkTemp]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
