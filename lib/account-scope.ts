import type { Platform } from "@/lib/platform-config";
import type { AccountScope } from "@/types/db";

export const ACCOUNT_SCOPE_OPTIONS: AccountScope[] = ["personal", "umbrella"];

export function accountScopeLabel(scope: AccountScope) {
  return scope === "umbrella" ? "Umbrella" : "Personal";
}

export function resolveAccountScope(
  platform: Platform,
  accountScope?: AccountScope | null
): AccountScope {
  if (accountScope === "personal" || accountScope === "umbrella") {
    return accountScope;
  }
  return platform === "facebook_umbrella" ? "umbrella" : "personal";
}

/** Facebook platforms own the Personal/Umbrella type; other platforms keep the current flag. */
export function accountScopeForPlatform(
  platform: Platform,
  currentScope?: AccountScope | null
): AccountScope {
  if (platform === "facebook_umbrella") return "umbrella";
  if (platform === "facebook_personal") return "personal";
  return resolveAccountScope(platform, currentScope);
}

export function applyAccountScopeToPlatform(
  platform: Platform,
  accountScope: AccountScope
): Platform {
  if (platform === "facebook_personal" || platform === "facebook_umbrella") {
    return accountScope === "umbrella" ? "facebook_umbrella" : "facebook_personal";
  }
  return platform;
}

export function normalizeSocialAccountInput<
  T extends { platform: Platform; accountScope?: AccountScope },
>(input: T): T & { accountScope: AccountScope; platform: Platform } {
  const accountScope = accountScopeForPlatform(input.platform, input.accountScope);
  return {
    ...input,
    accountScope,
    platform: applyAccountScopeToPlatform(input.platform, accountScope),
  };
}
