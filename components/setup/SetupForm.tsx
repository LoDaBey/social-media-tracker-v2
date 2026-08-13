"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link as LinkIcon, AlertCircle } from "lucide-react";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow, SetupFormProps, SetupProfile } from "@/types/setup";
import {
  PLATFORMS,
  type Platform,
} from "@/lib/platform-config";
import {
  setupButtonMotion,
  setupFadeUpChild,
  setupFooterVariants,
  setupHeroContainer,
  setupIconVariants,
  setupSectionVariants,
  setupStaggerContainer,
} from "@/lib/setup-motion";
import {
  firstSetupValidationMessage,
  getFirstErrorSetupStepIndex,
  getSetupProfileFieldErrors,
  getSetupRowFieldErrors,
  missingAccountsForSetupStep,
  setupStepHasErrors,
  setupStepMissingAccountsMessage,
} from "@/lib/setup-validation";
import { buildSetupSteps } from "@/lib/setup-steps";
import { saveAccountsAction } from "@/actions/setup";
import { PlatformAccountsCard } from "@/components/setup/PlatformAccountsCard";
import { FacebookAccountsCard } from "@/components/setup/FacebookAccountsCard";
import { SetupCancelButton } from "@/components/setup/SetupCancelButton";
import { SetupProfileFields } from "@/components/setup/SetupProfileFields";
import { SetupStepNav } from "@/components/setup/SetupStepNav";
import { ScrollToFirstSetupError } from "@/components/setup/ScrollToFirstSetupError";

type FormState = {
  error: string | null;
};

function emptyAccountRow(fullName: string): SetupAccountRow {
  return {
    id: crypto.randomUUID(),
    accountHolder: fullName,
    url: "",
    category: "",
    username: "",
    email: "",
    accountPassword: "",
    emailPassword: "",
    mobileNumber: "",
  };
}

function emptyRowFromExisting(
  fullName: string,
  a?: TempSocialMediaAccount
): SetupAccountRow {
  if (!a) return emptyAccountRow(fullName);
  return {
    id: `existing-${a.id}`,
    accountHolder: a.account_handle?.trim() || fullName,
    url: a.account_url,
    category: a.category ?? "",
    username: a.username ?? "",
    email: a.account_email ?? "",
    accountPassword: a.account_password ?? "",
    emailPassword: a.email_password ?? "",
    mobileNumber: a.mobile_number ?? "",
  };
}

function initialRowsForPlatform(
  fullName: string,
  targetCount: number,
  existing: TempSocialMediaAccount[]
): SetupAccountRow[] {
  if (targetCount <= 0) return [];
  const base = existing
    .slice(0, targetCount)
    .map((a) => emptyRowFromExisting(fullName, a));
  if (base.length) return base;
  return [emptyAccountRow(fullName)];
}

export function SetupForm({
  userId,
  fullName,
  targets,
  existingByPlatform,
  initialProfile,
}: SetupFormProps) {
  const assignedPlatforms = useMemo(
    () => PLATFORMS.filter((p) => targets[p] > 0),
    [targets]
  );

  const steps = useMemo(
    () => buildSetupSteps(assignedPlatforms),
    [assignedPlatforms]
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
        init[p] = initialRowsForPlatform(
          fullName,
          targets[p],
          existingByPlatform[p] ?? []
        );
      }
      return init;
    }
  );

  const [profile, setProfile] = useState<SetupProfile>(initialProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<FormState>({ error: null });
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [errorScrollToken, setErrorScrollToken] = useState(0);
  const [pending, startTransition] = useTransition();

  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[safeStepIndex];
  const isFirstStep = safeStepIndex <= 0;
  const isLastStep = safeStepIndex >= steps.length - 1;

  function revealFieldErrors() {
    setShowFieldErrors(true);
    setErrorScrollToken((token) => token + 1);
  }

  const rowFieldErrors = useMemo(
    () => getSetupRowFieldErrors(assignedPlatforms, rowsByPlatform),
    [assignedPlatforms, rowsByPlatform]
  );
  const profileFieldErrors = useMemo(
    () => getSetupProfileFieldErrors(profile),
    [profile]
  );

  const displayedRowFieldErrors = showFieldErrors ? rowFieldErrors : {};
  const displayedProfileFieldErrors = showFieldErrors ? profileFieldErrors : {};

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

  const countsMatchTargets = useMemo(
    () =>
      assignedPlatforms.every(
        (p) => (rowsByPlatform[p]?.length ?? 0) === targets[p]
      ),
    [assignedPlatforms, rowsByPlatform, targets]
  );

  const hasValidationErrors =
    Object.keys(profileFieldErrors).length > 0 ||
    Object.keys(rowFieldErrors).length > 0;

  function updateRow(platform: Platform, idx: number, patch: Partial<SetupAccountRow>) {
    setState({ error: null });
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      rows[idx] = { ...rows[idx], ...patch };
      next[platform] = rows;
      return next;
    });
  }

  function addRow(platform: Platform) {
    setState({ error: null });
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      if (rows.length >= targets[platform]) return prev;
      rows.push(emptyAccountRow(fullName));
      next[platform] = rows;
      return next;
    });
  }

  function addOneRowForUnderTargetPlatforms(platforms: Platform[]) {
    setRowsByPlatform((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const platform of platforms) {
        const rows = [...(next[platform] ?? [])];
        if (rows.length >= targets[platform]) continue;
        rows.push(emptyAccountRow(fullName));
        next[platform] = rows;
        changed = true;
      }
      return changed ? next : prev;
    });
  }

  function removeRow(platform: Platform, idx: number) {
    setState({ error: null });
    setRowsByPlatform((prev) => {
      const next = { ...prev };
      const rows = [...(next[platform] ?? [])];
      if (rows.length <= 1) return prev;
      rows.splice(idx, 1);
      next[platform] = rows;
      return next;
    });
  }

  function updateProfile(patch: Partial<SetupProfile>) {
    setState({ error: null });
    setProfile((prev) => ({
      ...prev,
      ...patch,
      // Country is admin-assigned and cannot be changed during setup.
      country: prev.country,
    }));
  }

  function buildPayload() {
    const accounts = assignedPlatforms.flatMap((platform) =>
      (rowsByPlatform[platform] ?? []).map((r) => ({
        platform,
        accountHolder: r.accountHolder.trim(),
        url: r.url.trim(),
        category: r.category.trim(),
        username: r.username.trim(),
        email: r.email.trim(),
        accountPassword: r.accountPassword,
        emailPassword: r.emailPassword,
        mobileNumber: r.mobileNumber.trim(),
      }))
    );
    return {
      country: profile.country,
      language: profile.language,
      accounts,
    };
  }

  function jumpToFirstErrorStep() {
    const nextIndex = getFirstErrorSetupStepIndex(
      steps,
      profileFieldErrors,
      rowFieldErrors,
      rowsByPlatform,
      targets
    );
    setStepIndex(nextIndex);
  }

  function onBack() {
    setState({ error: null });
    setStepIndex((index) => Math.max(0, index - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onNext() {
    if (!currentStep) return;
    setState({ error: null });

    if (currentStep.id === "profile") {
      const stepInvalid = setupStepHasErrors(
        currentStep.id,
        profileFieldErrors,
        rowFieldErrors,
        rowsByPlatform,
        targets
      );
      if (stepInvalid) {
        revealFieldErrors();
        setState({
          error: firstSetupValidationMessage(profileFieldErrors, {}),
        });
        return;
      }
      setShowFieldErrors(false);
      setStepIndex((index) => Math.min(steps.length - 1, index + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const missing = missingAccountsForSetupStep(
      currentStep.id,
      rowsByPlatform,
      targets
    );
    if (missing.length > 0) {
      addOneRowForUnderTargetPlatforms(missing.map((item) => item.platform));
      setState({
        error:
          setupStepMissingAccountsMessage(currentStep.id, missing) ??
          "Add more accounts to meet this platform's target.",
      });
      setErrorScrollToken((token) => token + 1);
      return;
    }

    const stepInvalid = setupStepHasErrors(
      currentStep.id,
      profileFieldErrors,
      rowFieldErrors,
      rowsByPlatform,
      targets
    );
    if (stepInvalid) {
      revealFieldErrors();
      setState({
        error: firstSetupValidationMessage(profileFieldErrors, rowFieldErrors),
      });
      return;
    }

    setShowFieldErrors(false);
    setStepIndex((index) => Math.min(steps.length - 1, index + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave() {
    setState({ error: null });

    if (!countsMatchTargets || hasValidationErrors) {
      jumpToFirstErrorStep();
      revealFieldErrors();
      setState({
        error: !countsMatchTargets
          ? "Please add exactly the assigned number of accounts per platform."
          : firstSetupValidationMessage(profileFieldErrors, rowFieldErrors),
      });
      return;
    }

    setShowFieldErrors(false);
    const formData = new FormData();
    formData.set("accounts", JSON.stringify(buildPayload()));
    formData.set("userId", String(userId));

    startTransition(async () => {
      const res = await saveAccountsAction(formData);
      if (res?.error) {
        jumpToFirstErrorStep();
        revealFieldErrors();
        setState({ error: res.error });
      }
    });
  }

  function renderFacebookCard() {
    if (
      targets.facebook_personal <= 0 &&
      targets.facebook_umbrella <= 0
    ) {
      return null;
    }

    return (
      <FacebookAccountsCard
        personal={
          targets.facebook_personal > 0
            ? {
                platform: "facebook_personal",
                targetCount: targets.facebook_personal,
                existingAccounts: existingByPlatform.facebook_personal ?? [],
                rows: rowsByPlatform.facebook_personal ?? [],
                fieldErrors: displayedRowFieldErrors,
                onChangeRow: (idx, patch) =>
                  updateRow("facebook_personal", idx, patch),
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
                fieldErrors: displayedRowFieldErrors,
                onChangeRow: (idx, patch) =>
                  updateRow("facebook_umbrella", idx, patch),
                onAddRow: () => addRow("facebook_umbrella"),
                onRemoveRow: (idx) => removeRow("facebook_umbrella", idx),
              }
            : null
        }
      />
    );
  }

  function renderPlatformCard(platform: Platform) {
    if (targets[platform] <= 0) return null;
    return (
      <PlatformAccountsCard
        key={platform}
        platform={platform}
        targetCount={targets[platform]}
        existingAccounts={existingByPlatform[platform] ?? []}
        rows={rowsByPlatform[platform] ?? []}
        fieldErrors={displayedRowFieldErrors}
        onChangeRow={(idx, patch) => updateRow(platform, idx, patch)}
        onAddRow={() => addRow(platform)}
        onRemoveRow={(idx) => removeRow(platform, idx)}
      />
    );
  }

  function renderSteppedContent() {
    if (!currentStep) return null;

    if (currentStep.id === "profile") {
      return (
        <SetupProfileFields
          country={profile.country}
          language={profile.language}
          fieldErrors={displayedProfileFieldErrors}
          onChange={updateProfile}
        />
      );
    }

    if (currentStep.id === "facebook") {
      return renderFacebookCard();
    }

    return renderPlatformCard(currentStep.id);
  }

  return (
    <div
      className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 lg:px-6"
      style={{ paddingBlockStart: 28 }}
    >
      <ScrollToFirstSetupError token={errorScrollToken} />
      <motion.section
        className="flex flex-col items-center text-center"
        variants={setupHeroContainer}
        initial="hidden"
        animate="show"
      >
        <motion.div
          className="flex items-center justify-center rounded-full bg-[var(--color-emerald)] text-white"
          style={{ width: 56, height: 56 }}
          aria-hidden="true"
          variants={setupIconVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
        >
          <LinkIcon className="h-6 w-6" />
        </motion.div>

        <motion.h1
          className="mt-4 text-[28px] leading-tight text-[var(--color-ink)] sm:text-[32px] lg:text-[36px]"
          style={{ fontFamily: "var(--font-cairo)", fontWeight: 800 }}
          variants={setupFadeUpChild}
        >
          Let&apos;s set up your accounts
        </motion.h1>

        <motion.p
          className="mt-2 text-[14px] text-[var(--color-muted)] sm:text-[16px]"
          style={{
            fontFamily: "var(--font-cairo)",
            fontWeight: 400,
            maxWidth: 520,
          }}
          variants={setupFadeUpChild}
        >
          Follow each step to add your profile and social accounts.
        </motion.p>

        <motion.div className="mt-5 w-full" variants={setupFadeUpChild}>
          <SetupStepNav steps={steps} currentIndex={safeStepIndex} />
        </motion.div>
      </motion.section>

      <motion.div
        className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-6 lg:mt-10"
        variants={setupStaggerContainer}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id ?? "step"}
            variants={setupSectionVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {renderSteppedContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="h-16 sm:h-20" aria-hidden="true" />

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-hairline)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBlock: 8, paddingInline: 10 }}
        variants={setupFooterVariants}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto w-full max-w-7xl px-0 sm:px-2 lg:px-4">
          <AnimatePresence mode="wait">
            {state.error ? (
              <motion.div
                key={state.error}
                className="mb-2 flex items-center gap-2 rounded-full bg-[var(--color-coral-tint)] px-3 py-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <AlertCircle
                  className="h-4 w-4 shrink-0 text-[var(--color-coral)]"
                  aria-hidden="true"
                />
                <p
                  className="text-[12px] font-medium text-[var(--color-coral)] sm:text-[13px]"
                  style={{ fontFamily: "var(--font-cairo)" }}
                >
                  {state.error}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex min-w-0 items-center justify-between gap-2">
            <motion.p
              className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight text-[var(--color-ink)] sm:text-[13px]"
              style={{ fontFamily: "var(--font-cairo)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              title={
                stillMissing === 0
                  ? `${totalSavedAccounts} of ${totalTarget} accounts saved — All targets met`
                  : `${totalSavedAccounts} of ${totalTarget} accounts saved — ${stillMissing} still missing`
              }
            >
              <span className="sm:hidden">
                {totalSavedAccounts}/{totalTarget}
                <span className="text-[var(--color-muted)]"> · </span>
                <span
                  className={
                    stillMissing === 0
                      ? "text-[var(--color-emerald)]"
                      : "text-[var(--color-coral)]"
                  }
                >
                  {stillMissing === 0 ? "Done" : `${stillMissing} left`}
                </span>
              </span>
              <span className="hidden sm:inline">
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
              </span>
            </motion.p>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <SetupCancelButton disabled={pending} />
              {!isFirstStep ? (
                <motion.button
                  type="button"
                  aria-label="Go to previous setup step"
                  disabled={pending}
                  onClick={onBack}
                  layout
                  className={[
                    "cursor-pointer rounded-lg",
                    "h-9 px-3 sm:h-10 sm:px-4",
                    "border border-[var(--color-hairline)] bg-white",
                    "font-[var(--font-cairo)] font-bold text-[13px] text-[var(--color-ink)] sm:text-[14px]",
                    "hover:bg-[var(--color-cream-tint)]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                  ].join(" ")}
                  {...setupButtonMotion(pending)}
                >
                  Back
                </motion.button>
              ) : null}
              {!isLastStep ? (
                <motion.button
                  type="button"
                  aria-label="Go to next setup step"
                  disabled={pending}
                  onClick={onNext}
                  layout
                  className={[
                    "cursor-pointer rounded-lg",
                    "h-9 px-3.5 sm:h-10 sm:px-5",
                    "bg-[var(--color-emerald)] text-white",
                    "font-[var(--font-cairo)] font-bold text-[13px] sm:text-[14px]",
                    "hover:bg-[var(--color-emerald-hover)]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                  ].join(" ")}
                  {...setupButtonMotion(pending)}
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  aria-label="Save and continue"
                  disabled={pending}
                  onClick={onSave}
                  layout
                  className={[
                    "cursor-pointer rounded-lg",
                    "h-9 px-3.5 sm:h-10 sm:px-5",
                    "bg-[var(--color-emerald)] text-white",
                    "font-[var(--font-cairo)] font-bold text-[13px] sm:text-[14px]",
                    "hover:bg-[var(--color-emerald-hover)]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
                  ].join(" ")}
                  {...setupButtonMotion(pending)}
                >
                  {pending ? "Saving..." : "Save"}
                  <span className="hidden sm:inline">
                    {pending ? "" : " and continue"}
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
