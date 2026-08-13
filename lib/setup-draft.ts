import { PLATFORMS, type Platform } from "@/lib/platform-config";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow, SetupDraft, SetupProfile } from "@/types/setup";

const STORAGE_PREFIX = "alphaa:setup-draft:";
const DRAFT_VERSION = 1 as const;

function storageKey(userId: number) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function setupExistingSignature(
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>
) {
  return JSON.stringify(
    PLATFORMS.map((platform) =>
      (existingByPlatform[platform] ?? []).map(
        (account) => `${account.id}:${account.account_url}`
      )
    )
  );
}

function isAccountRow(value: unknown): value is SetupAccountRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.accountHolder === "string" &&
    typeof row.url === "string" &&
    typeof row.category === "string" &&
    typeof row.username === "string" &&
    typeof row.email === "string" &&
    typeof row.accountPassword === "string" &&
    typeof row.emailPassword === "string" &&
    typeof row.mobileNumber === "string"
  );
}

function isProfile(value: unknown): value is SetupProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return typeof profile.country === "string" && typeof profile.language === "string";
}

function sameTargets(
  left: Record<Platform, number>,
  right: Record<Platform, number>
) {
  return PLATFORMS.every((platform) => left[platform] === right[platform]);
}

export function readSetupDraft(userId: number): SetupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SetupDraft>;
    if (parsed.version !== DRAFT_VERSION) return null;
    if (parsed.userId !== userId) return null;
    if (typeof parsed.stepIndex !== "number" || parsed.stepIndex < 0) return null;
    if (!isProfile(parsed.profile) || !parsed.rowsByPlatform || !parsed.targets) {
      return null;
    }
    if (typeof parsed.existingSignature !== "string") return null;

    const rowsByPlatform = {} as Record<Platform, SetupAccountRow[]>;
    for (const platform of PLATFORMS) {
      const rows = parsed.rowsByPlatform[platform];
      if (!Array.isArray(rows) || !rows.every(isAccountRow)) return null;
      rowsByPlatform[platform] = rows;
    }

    const targets = {} as Record<Platform, number>;
    for (const platform of PLATFORMS) {
      const count = parsed.targets[platform];
      if (typeof count !== "number" || !Number.isFinite(count)) return null;
      targets[platform] = count;
    }

    return {
      version: DRAFT_VERSION,
      userId,
      stepIndex: parsed.stepIndex,
      profile: parsed.profile,
      rowsByPlatform,
      targets,
      existingSignature: parsed.existingSignature,
    };
  } catch {
    return null;
  }
}

export function writeSetupDraft(draft: SetupDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(draft.userId), JSON.stringify(draft));
  } catch {
    // Quota or private mode — keep setup usable without persistence.
  }
}

export function clearSetupDraft(userId: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore storage failures on cleanup.
  }
}

export function isSetupDraftReusable(
  draft: SetupDraft,
  input: {
    userId: number;
    targets: Record<Platform, number>;
    existingSignature: string;
  }
) {
  return (
    draft.userId === input.userId &&
    draft.existingSignature === input.existingSignature &&
    sameTargets(draft.targets, input.targets)
  );
}
