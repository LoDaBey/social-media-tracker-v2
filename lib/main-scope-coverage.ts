/**
 * Main (ALPHAA) tab: each platform split into personal / umbrella (or one native
 * cell for native-only platforms such as 1000Kitap, KızlarSoruyor, Balatarin).
 * Targets come from the Main plan's per-scope targets; actuals from account_scope.
 */
import { STRATEGY_PLATFORM_KEYS } from "@/lib/strategy-platforms";
import type {
  AdminCoverageCount,
  MainScopeColumn,
  MainScopeCoverage,
  MainScopeKey,
} from "@/types/admin";
import type { StrategyPlatformKey, StrategyScopeCounts } from "@/types/strategy";

/** Live account counts per platform and personal / umbrella. */
export type MainScopeActuals = Partial<
  Record<StrategyPlatformKey, { personal?: number; umbrella?: number }>
>;

const SCOPE_ORDER: MainScopeKey[] = ["personal", "umbrella", "native"];

function count(actual: number, target: number): AdminCoverageCount {
  return { actual, target };
}

/** Same rule as the plan totals: extras above a target never fill another gap. */
function credited(actual: number, target: number) {
  return target <= 0 ? 0 : Math.min(actual, target);
}

/** temp platform + account_scope → Main platform key and scope. */
export function mainScopeOfAccount(
  platform: string,
  accountScope: string | null
): { platform: StrategyPlatformKey; scope: "personal" | "umbrella" } | null {
  if (platform === "facebook_personal") return { platform: "facebook", scope: "personal" };
  if (platform === "facebook_umbrella") return { platform: "facebook", scope: "umbrella" };
  const key = (platform === "x" ? "twitter" : platform) as StrategyPlatformKey;
  if (!STRATEGY_PLATFORM_KEYS.includes(key)) return null;
  return { platform: key, scope: accountScope === "umbrella" ? "umbrella" : "personal" };
}

export function addMainScopeActual(
  into: MainScopeActuals,
  platform: StrategyPlatformKey,
  scope: "personal" | "umbrella",
  n: number
) {
  const cell = (into[platform] ??= {});
  cell[scope] = (cell[scope] ?? 0) + n;
}

/** Pair actuals with targets. Native-only targets → one native cell (all accounts). */
export function buildMainScopes(
  actuals: MainScopeActuals | undefined,
  targets: StrategyScopeCounts | undefined
): MainScopeCoverage {
  const out: MainScopeCoverage = {};
  for (const platform of STRATEGY_PLATFORM_KEYS) {
    const a = actuals?.[platform] ?? {};
    const t = targets?.[platform] ?? {};
    const ap = a.personal ?? 0;
    const au = a.umbrella ?? 0;
    const tp = t.personal ?? 0;
    const tu = t.umbrella ?? 0;
    const tn = t.native ?? 0;

    if (tn > 0 && tp === 0 && tu === 0) {
      out[platform] = { native: count(ap + au, tn) };
      continue;
    }
    const cell: Partial<Record<MainScopeKey, AdminCoverageCount>> = {};
    if (tp > 0 || ap > 0) cell.personal = count(ap, tp);
    // A native target next to personal targets counts with umbrella (as the plan did).
    if (tu + tn > 0 || au > 0) cell.umbrella = count(au, tu + tn);
    if (Object.keys(cell).length > 0) out[platform] = cell;
  }
  return out;
}

/** One seat's share of each per-scope target (same base + remainder split as seats). */
export function seatScopeTargets(
  targets: StrategyScopeCounts | undefined,
  index: number,
  seats: number
): StrategyScopeCounts {
  const out: StrategyScopeCounts = {};
  if (!targets || seats <= 0 || index >= seats) return out;
  for (const platform of STRATEGY_PLATFORM_KEYS) {
    const scopes = targets[platform];
    if (!scopes) continue;
    const row: Partial<Record<MainScopeKey, number>> = {};
    for (const scope of SCOPE_ORDER) {
      const total = scopes[scope] ?? 0;
      if (total <= 0) continue;
      const share = Math.floor(total / seats) + (index < total % seats ? 1 : 0);
      if (share > 0) row[scope] = share;
    }
    if (Object.keys(row).length > 0) out[platform] = row;
  }
  return out;
}

/** Totals row: credited actuals (capped at target) like the other totals. */
export function addCreditedMainScopes(
  sum: MainScopeCoverage | undefined,
  next: MainScopeCoverage | undefined
): MainScopeCoverage | undefined {
  if (!next) return sum;
  const out: MainScopeCoverage = { ...(sum ?? {}) };
  for (const platform of STRATEGY_PLATFORM_KEYS) {
    const cells = next[platform];
    if (!cells) continue;
    const merged = { ...(out[platform] ?? {}) };
    for (const scope of SCOPE_ORDER) {
      const cell = cells[scope];
      if (!cell) continue;
      const current = merged[scope] ?? count(0, 0);
      merged[scope] = count(
        current.actual + credited(cell.actual, cell.target),
        current.target + cell.target
      );
    }
    out[platform] = merged;
  }
  return out;
}

/** Which sub-columns each platform needs, from every row shown. */
export function mainScopeColumns(
  list: (MainScopeCoverage | undefined)[]
): MainScopeColumn[] {
  return STRATEGY_PLATFORM_KEYS.map((platform) => {
    const used = new Set<MainScopeKey>();
    for (const scopes of list) {
      for (const scope of SCOPE_ORDER) {
        if (scopes?.[platform]?.[scope]) used.add(scope);
      }
    }
    // Personal and umbrella always come as a pair, so columns line up.
    if (used.has("personal") || used.has("umbrella")) {
      used.add("personal");
      used.add("umbrella");
    }
    return { platform, scopes: SCOPE_ORDER.filter((scope) => used.has(scope)) };
  });
}

export function mainScopeSubColumnCount(columns: MainScopeColumn[]) {
  return columns.reduce((n, column) => n + Math.max(column.scopes.length, 1), 0);
}
