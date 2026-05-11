"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link as LinkIcon, AlertCircle } from "lucide-react";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow } from "@/types/setup";
import {
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORMS,
  type Platform,
} from "@/lib/platform-config";
import {
  setupButtonMotion,
  setupFadeUpChild,
  setupFooterVariants,
  setupHeroContainer,
  setupIconVariants,
  setupPillList,
  setupPillVariants,
  setupStaggerContainer,
} from "@/lib/setup-motion";
import { saveAccountsAction } from "@/actions/setup";
import { PlatformAccountsCard } from "@/components/setup/PlatformAccountsCard";
import { FacebookAccountsCard } from "@/components/setup/FacebookAccountsCard";

type Props = {
  userId: number;
  targets: Record<Platform, number>;
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>;
};

type FormState = {
  error: string | null;
};

function normalizeHandleOnBlur(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function emptyRowFromExisting(a?: TempSocialMediaAccount): SetupAccountRow {
  if (!a) {
    return { id: crypto.randomUUID(), handle: "", url: "", followers: "0" };
  }
  return {
    id: `existing-${a.id}`,
    handle: a.account_handle ?? `@${a.account_name}`,
    url: a.account_url,
    followers: String(a.current_followers ?? a.starting_followers ?? 0),
  };
}

function initialRowsForPlatform(
  targetCount: number,
  existing: TempSocialMediaAccount[]
): SetupAccountRow[] {
  if (targetCount <= 0) return [];
  const base = existing.slice(0, targetCount).map((a) => emptyRowFromExisting(a));
  if (base.length) return base;
  return [{ id: crypto.randomUUID(), handle: "", url: "", followers: "0" }];
}

export function SetupForm({ userId, targets, existingByPlatform }: Props) {
  const assignedPlatforms = useMemo(
    () => PLATFORMS.filter((p) => targets[p] > 0),
    [targets]
  );

  const totalTarget = useMemo(
    () => assignedPlatforms.reduce((sum, p) => sum + targets[p], 0),
    [assignedPlatforms, targets]
  );

  const [rowsByPlatform, setRowsByPlatform] = useState<Record<Platform, SetupAccountRow[]>>(
    () => {
      const init: Record<Platform, SetupAccountRow[]> = {
        x: [],
        facebook_personal: [],
        facebook_umbrella: [],
        instagram: [],
        tiktok: [],
      };
      for (const p of assignedPlatforms) {
        init[p] = initialRowsForPlatform(targets[p], existingByPlatform[p] ?? []);
      }
      return init;
    }
  );

  const [state, setState] = useState<FormState>({ error: null });
  const [pending, startTransition] = useTransition();

  const totalSavedAccounts = useMemo(() => {
    return assignedPlatforms.reduce(
      (sum, p) => sum + (existingByPlatform[p]?.length ?? 0),
      0
    );
  }, [assignedPlatforms, existingByPlatform]);

  const stillMissing = useMemo(() => Math.max(0, totalTarget - totalSavedAccounts), [
    totalSavedAccounts,
    totalTarget,
  ]);

  const isExactlyAtTargets = useMemo(() => {
    const countsOk = assignedPlatforms.every(
      (p) => (rowsByPlatform[p]?.length ?? 0) === targets[p]
    );
    if (!countsOk) return false;

    const rowsOk = assignedPlatforms.every((p) =>
      (rowsByPlatform[p] ?? []).every((r) => {
        const handle = r.handle.trim();
        const url = r.url.trim();
        const followers = r.followers.trim();
        if (!handle) return false;
        if (!url) return false;
        if (!followers) return false;
        if (!/^\d+$/.test(followers)) return false;
        return true;
      })
    );
    return rowsOk;
  }, [assignedPlatforms, rowsByPlatform, targets]);

  function updateRow(platform: Platform, idx: number, patch: Partial<SetupAccountRow>) {
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      rows[idx] = { ...rows[idx], ...patch };
      next[platform] = rows;
      return next;
    });
  }

  function blurHandle(platform: Platform, idx: number) {
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      const row = rows[idx];
      rows[idx] = { ...row, handle: normalizeHandleOnBlur(row?.handle ?? "") };
      next[platform] = rows;
      return next;
    });
  }

  function addRow(platform: Platform) {
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      if (rows.length >= targets[platform]) return prev;
      rows.push({ id: crypto.randomUUID(), handle: "", url: "", followers: "0" });
      next[platform] = rows;
      return next;
    });
  }

  function removeRow(platform: Platform, idx: number) {
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      if (rows.length <= 1) return prev;
      rows.splice(idx, 1);
      next[platform] = rows;
      return next;
    });
  }

  function buildPayload() {
    const accounts = assignedPlatforms.flatMap((platform) =>
      (rowsByPlatform[platform] ?? []).map((r) => ({
        platform,
        handle: r.handle.trim(),
        url: r.url.trim(),
        followers: Number(r.followers || "0"),
      }))
    );
    return { accounts };
  }

  async function onSave() {
    setState({ error: null });
    const formData = new FormData();
    formData.set("accounts", JSON.stringify(buildPayload()));
    formData.set("userId", String(userId));

    startTransition(async () => {
      const res = await saveAccountsAction(formData);
      if (res?.error) setState({ error: res.error });
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl" style={{ paddingBlockStart: 48 }}>
      <motion.section
        className="flex flex-col items-center text-center"
        variants={setupHeroContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="flex items-center justify-center rounded-full bg-[var(--color-emerald)] text-white"
          style={{ width: 64, height: 64 }}
          aria-hidden="true"
          variants={setupIconVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          <LinkIcon className="h-7 w-7" />
        </motion.div>

        <motion.h1
          className="mt-5 text-[36px] leading-tight text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-cairo)", fontWeight: 800 }}
          variants={setupFadeUpChild}
        >
          Let&apos;s set up your accounts
        </motion.h1>

        <motion.p
          className="mt-3 text-[16px] text-[var(--color-muted)]"
          style={{
            fontFamily: "var(--font-cairo)",
            fontWeight: 400,
            maxWidth: 520,
          }}
          variants={setupFadeUpChild}
        >
          Add the social media accounts you&apos;ve been assigned. We&apos;ll save
          them so you don&apos;t have to do this again.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-2"
          variants={setupPillList}
        >
          {assignedPlatforms.map((platform) => {
            const Icon = PLATFORM_ICONS[platform];
            return (
              <motion.span
                key={platform}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[var(--color-hairline)] bg-[var(--color-surface)] px-[14px] py-2"
                style={{ fontFamily: "var(--font-cairo)" }}
                aria-label={`${targets[platform]} ${PLATFORM_LABELS[platform]}`}
                variants={setupPillVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                <Icon className="text-[var(--color-ink)]" size={16} aria-hidden="true" />
                <span className="text-[13px] font-semibold text-[var(--color-ink)] tabular-nums">
                  {targets[platform]}
                </span>
                <span className="text-[13px] font-medium text-[var(--color-muted)]">
                  · {PLATFORM_LABELS[platform]}
                </span>
              </motion.span>
            );
          })}
        </motion.div>
      </motion.section>

      <motion.div
        className="mt-10 flex flex-col gap-6"
        variants={setupStaggerContainer}
        initial="hidden"
        animate="show"
      >
        {assignedPlatforms.some(
          (p) => p === "facebook_personal" || p === "facebook_umbrella"
        ) ? (
            <FacebookAccountsCard
            personal={
              targets.facebook_personal > 0
                ? {
                    platform: "facebook_personal",
                    targetCount: targets.facebook_personal,
                    existingAccounts: existingByPlatform.facebook_personal ?? [],
                    rows: rowsByPlatform.facebook_personal ?? [],
                    onChangeRow: (idx, patch) =>
                      updateRow("facebook_personal", idx, patch),
                    onBlurHandle: (idx) => blurHandle("facebook_personal", idx),
                    onAddRow: () => addRow("facebook_personal"),
                    onRemoveRow: (idx) => removeRow("facebook_personal", idx),
                  }
                : null
            }
            umbrella={
              targets.facebook_umbrella > 0
                ? {
                    platform: "facebook_umbrella",
                    targetCount: targets.facebook_umbrella,
                    existingAccounts: existingByPlatform.facebook_umbrella ?? [],
                    rows: rowsByPlatform.facebook_umbrella ?? [],
                    onChangeRow: (idx, patch) =>
                      updateRow("facebook_umbrella", idx, patch),
                    onBlurHandle: (idx) => blurHandle("facebook_umbrella", idx),
                    onAddRow: () => addRow("facebook_umbrella"),
                    onRemoveRow: (idx) => removeRow("facebook_umbrella", idx),
                  }
                : null
            }
          />
        ) : null}

        {assignedPlatforms
          .filter(
            (p) => p !== "facebook_personal" && p !== "facebook_umbrella"
          )
          .map((platform) => (
            <PlatformAccountsCard
              key={platform}
              platform={platform}
              targetCount={targets[platform]}
              existingAccounts={existingByPlatform[platform] ?? []}
              rows={rowsByPlatform[platform] ?? []}
              onChangeRow={(idx, patch) => updateRow(platform, idx, patch)}
              onBlurHandle={(idx) => blurHandle(platform, idx)}
              onAddRow={() => addRow(platform)}
              onRemoveRow={(idx) => removeRow(platform, idx)}
            />
          ))}
      </motion.div>

      <div className="h-24" aria-hidden="true" />

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-hairline)] bg-[var(--color-surface)]"
        style={{ paddingBlock: 16, paddingInline: 16 }}
        variants={setupFooterVariants}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <AnimatePresence mode="wait">
            {state.error ? (
              <motion.div
                key={state.error}
                className="mb-3 flex items-center gap-2 rounded-full bg-[var(--color-coral-tint)] px-3 py-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <AlertCircle
                  className="h-4 w-4 text-[var(--color-coral)]"
                  aria-hidden="true"
                />
                <p
                  className="text-[13px] font-medium text-[var(--color-coral)]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  {state.error}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <motion.p
              className="text-[13px] font-semibold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-cairo)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
            >
              {totalSavedAccounts} of {totalTarget} accounts saved{" "}
              <span className="text-[var(--color-muted)]">— </span>
              <span
                className={
                  stillMissing === 0
                    ? "text-[var(--color-emerald)]"
                    : "text-[var(--color-coral)]"
                }
              >
                {stillMissing === 0
                  ? "All targets met"
                  : `${stillMissing} still missing`}
              </span>
            </motion.p>

            <motion.button
              type="button"
              aria-label="Save and continue"
              disabled={!isExactlyAtTargets || pending}
              onClick={onSave}
              className={[
                "cursor-pointer rounded-lg",
                "h-[48px]",
                "px-5",
                "rounded-[var(--radius-button)]",
                "bg-[var(--color-emerald)] text-white",
                "font-[var(--font-cairo)] font-bold text-[14px]",
                "transition-colors",
                "hover:bg-[var(--color-emerald-hover)]",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
              ].join(" ")}
              {...setupButtonMotion(!isExactlyAtTargets || pending)}
            >
              {pending ? "Saving..." : "Save and continue"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

