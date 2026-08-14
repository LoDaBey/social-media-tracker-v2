import { PLATFORM_LABELS, type Platform } from "@/lib/platform-config";
import { platformsForSetupStep } from "@/lib/setup-steps";
import {
  FACEBOOK_PLATFORMS,
  facebookRequiredTarget,
  isFacebookPlatform,
} from "@/lib/setup-facebook";
import {
  isPlatformAccountUrl,
  isValidAccountUrl,
  setupAccountFieldsSchemaFor,
  setupProfileSchema,
} from "@/lib/setup-schema";
import type {
  SetupAccountField,
  SetupAccountFieldErrors,
  SetupAccountRow,
  SetupProfile,
  SetupProfileFieldErrors,
  SetupRowFieldErrors,
  SetupStep,
  SetupStepId,
} from "@/types/setup";

export {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
  platformUrlPlaceholder,
} from "@/lib/setup-schema";

export function accountUrlKey(platform: Platform, url: string) {
  return `${platform}:${url.trim().replace(/\/+$/, "").toLowerCase()}`;
}

export function isSetupAccountRowComplete(row: SetupAccountRow, platform: Platform) {
  return setupAccountFieldsSchemaFor(platform).safeParse(row).success;
}

export function facebookCompleteRowCount(
  rowsByPlatform: Record<Platform, SetupAccountRow[]>
) {
  return FACEBOOK_PLATFORMS.reduce(
    (sum, platform) =>
      sum +
      (rowsByPlatform[platform] ?? []).filter((row) =>
        isSetupAccountRowComplete(row, platform)
      ).length,
    0
  );
}

/** Incomplete Facebook rows are optional once the Facebook quota is met. */
export function ignoredFacebookRowIds(
  rowsByPlatform: Record<Platform, SetupAccountRow[]>,
  targets: Record<Platform, number>
) {
  const required = facebookRequiredTarget(targets);
  if (facebookCompleteRowCount(rowsByPlatform) < required) {
    return new Set<string>();
  }

  const ids = new Set<string>();
  for (const platform of FACEBOOK_PLATFORMS) {
    for (const row of rowsByPlatform[platform] ?? []) {
      if (!isSetupAccountRowComplete(row, platform)) ids.add(row.id);
    }
  }
  return ids;
}

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[]
): SetupAccountFieldErrors {
  const errors: SetupAccountFieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    if (errors[key as SetupAccountField]) continue;
    errors[key as SetupAccountField] = issue.message;
  }
  return errors;
}

export function getSetupRowFieldErrors(
  assignedPlatforms: Platform[],
  rowsByPlatform: Record<Platform, SetupAccountRow[]>,
  targets?: Record<Platform, number>
): SetupRowFieldErrors {
  const errors: SetupRowFieldErrors = {};
  const seenUrls = new Map<string, string>();
  const ignored = targets
    ? ignoredFacebookRowIds(rowsByPlatform, targets)
    : new Set<string>();

  for (const platform of assignedPlatforms) {
    for (const row of rowsByPlatform[platform] ?? []) {
      if (ignored.has(row.id)) continue;
      const parsed = setupAccountFieldsSchemaFor(platform).safeParse(row);
      const fieldErrors = parsed.success
        ? {}
        : fieldErrorsFromZod(parsed.error.issues);

      const url = row.url.trim();
      if (url && isValidAccountUrl(url) && isPlatformAccountUrl(platform, url)) {
        const key = accountUrlKey(platform, url);
        const firstRowId = seenUrls.get(key);
        if (firstRowId) {
          errors[firstRowId] = {
            ...(errors[firstRowId] ?? {}),
            url: "Same URL used twice.",
          };
          fieldErrors.url = "Same URL used twice.";
        } else {
          seenUrls.set(key, row.id);
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        errors[row.id] = { ...(errors[row.id] ?? {}), ...fieldErrors };
      }
    }
  }

  return errors;
}

export function getSetupProfileFieldErrors(
  profile: SetupProfile
): SetupProfileFieldErrors {
  const parsed = setupProfileSchema.safeParse(profile);
  if (parsed.success) return {};

  const errors: SetupProfileFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (key === "country" || key === "language") {
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  return errors;
}

export function firstSetupValidationMessage(
  profileErrors: SetupProfileFieldErrors,
  rowErrors: SetupRowFieldErrors
) {
  const profileMessage =
    profileErrors.country ?? profileErrors.language ?? null;
  if (profileMessage) return profileMessage;

  for (const fields of Object.values(rowErrors)) {
    const message =
      fields.accountHolder ??
      fields.url ??
      fields.category ??
      fields.username ??
      fields.email ??
      fields.accountPassword ??
      fields.emailPassword ??
      fields.mobileNumber;
    if (message) return message;
  }
  return "Fix the highlighted fields.";
}

export function missingAccountsForSetupStep(
  stepId: SetupStepId,
  rowsByPlatform: Record<Platform, SetupAccountRow[]>,
  targets: Record<Platform, number>
) {
  if (stepId === "facebook") {
    const required = facebookRequiredTarget(targets);
    if (required <= 0) return [];
    const missing = Math.max(
      0,
      required - facebookCompleteRowCount(rowsByPlatform)
    );
    if (missing <= 0) return [];
    const personalRows = rowsByPlatform.facebook_personal?.length ?? 0;
    const umbrellaRows = rowsByPlatform.facebook_umbrella?.length ?? 0;
    const platform: Platform =
      personalRows <= umbrellaRows
        ? "facebook_personal"
        : "facebook_umbrella";
    return [{ platform, missing }];
  }

  return platformsForSetupStep(stepId)
    .filter((platform) => targets[platform] > 0)
    .map((platform) => ({
      platform,
      missing: Math.max(
        0,
        targets[platform] - (rowsByPlatform[platform]?.length ?? 0)
      ),
    }))
    .filter((item) => item.missing > 0);
}

export function setupStepMissingAccountsMessage(
  stepId: SetupStepId,
  missing: { platform: Platform; missing: number }[]
) {
  const totalMissing = missing.reduce((sum, item) => sum + item.missing, 0);
  if (totalMissing <= 0) return null;

  if (stepId === "facebook" && missing.length > 1) {
    return `You're still missing ${totalMissing} accounts to meet the Facebook targets. Add more accounts below.`;
  }

  const platform = missing[0]?.platform;
  const label =
    stepId === "facebook"
      ? "Facebook"
      : platform
        ? PLATFORM_LABELS[platform]
        : "this platform";

  return `You're still missing ${totalMissing} account${
    totalMissing === 1 ? "" : "s"
  } to meet the ${label} target. Add more accounts below.`;
}

export function setupStepHasErrors(
  stepId: SetupStepId,
  profileErrors: SetupProfileFieldErrors,
  rowErrors: SetupRowFieldErrors,
  rowsByPlatform: Record<Platform, SetupAccountRow[]>,
  targets: Record<Platform, number>
) {
  if (stepId === "profile") {
    return Object.keys(profileErrors).length > 0;
  }

  if (stepId === "facebook") {
    const required = facebookRequiredTarget(targets);
    const complete = facebookCompleteRowCount(rowsByPlatform);
    if (complete !== required) return true;
    const ignored = ignoredFacebookRowIds(rowsByPlatform, targets);
    for (const platform of FACEBOOK_PLATFORMS) {
      for (const row of rowsByPlatform[platform] ?? []) {
        if (ignored.has(row.id)) continue;
        if (rowErrors[row.id] && Object.keys(rowErrors[row.id]).length > 0) {
          return true;
        }
      }
    }
    return false;
  }

  const platforms = platformsForSetupStep(stepId).filter((p) => targets[p] > 0);
  for (const platform of platforms) {
    if (isFacebookPlatform(platform)) continue;
    if ((rowsByPlatform[platform]?.length ?? 0) !== targets[platform]) {
      return true;
    }
    for (const row of rowsByPlatform[platform] ?? []) {
      if (rowErrors[row.id] && Object.keys(rowErrors[row.id]).length > 0) {
        return true;
      }
    }
  }
  return false;
}

export function getFirstErrorSetupStepIndex(
  steps: SetupStep[],
  profileErrors: SetupProfileFieldErrors,
  rowErrors: SetupRowFieldErrors,
  rowsByPlatform: Record<Platform, SetupAccountRow[]>,
  targets: Record<Platform, number>
) {
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (
      setupStepHasErrors(
        step.id,
        profileErrors,
        rowErrors,
        rowsByPlatform,
        targets
      )
    ) {
      return index;
    }
  }
  return 0;
}
