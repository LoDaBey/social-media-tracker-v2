"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Link as LinkIcon, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { TempSocialMediaAccount } from "@/types/db";
import type { SetupAccountRow, SetupFormProps, SetupProfile } from "@/types/setup";
import {
  PLATFORMS,
  type Platform,
} from "@/lib/platform-config";
import {
  clearSetupDraft,
  isSetupDraftReusable,
  readSetupDraft,
  setupExistingSignature,
  writeSetupDraft,
} from "@/lib/setup-draft";
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
  accountsMeetTargets,
  facebookRequiredTarget,
  isFacebookPlatform,
} from "@/lib/setup-facebook";
import {
  firstSetupValidationMessage,
  getFirstErrorSetupStepIndex,
  getSetupProfileFieldErrors,
  getSetupRowFieldErrors,
  ignoredFacebookRowIds,
  isSetupAccountRowComplete,
  facebookCompleteRowCount,
  missingAccountsForSetupStep,
  resumeSetupStepIndex,
  setupStepHasErrors,
  setupStepMissingAccountsMessage,
} from "@/lib/setup-validation";
import { buildSetupSteps } from "@/lib/setup-steps";
import { saveAccountsAction } from "@/actions/setup";
import { saveEmployeeAccountsAsManager } from "@/actions/manager-setup";
import { PlatformAccountsCard } from "@/components/setup/PlatformAccountsCard";
import { FacebookAccountsCard } from "@/components/setup/FacebookAccountsCard";
import { SetupCancelButton } from "@/components/setup/SetupCancelButton";
import { SetupProfileFields } from "@/components/setup/SetupProfileFields";
import { SetupStepNav } from "@/components/setup/SetupStepNav";
import { ScrollToFirstSetupError } from "@/components/setup/ScrollToFirstSetupError";
import { SetupDraftRestoring } from "@/components/setup/SetupDraftRestoring";

type FormState = {
  error: string | null;
};

function emptySubscribe() {
  return () => {};
}

function buildInitialRowsByPlatform(
  fullName: string,
  assignedPlatforms: Platform[],
  targets: Record<Platform, number>,
  existingByPlatform: Record<Platform, TempSocialMediaAccount[]>
): Record<Platform, SetupAccountRow[]> {
  const init: Record<Platform, SetupAccountRow[]> = {
    x: [],
    facebook_personal: [],
    facebook_umbrella: [],
    instagram: [],
    tiktok: [],
  };
  for (const p of assignedPlatforms) {
    init[p] = isFacebookPlatform(p)
      ? initialFacebookTypeRows(fullName, existingByPlatform[p] ?? [])
      : initialRowsForPlatform(
          fullName,
          targets[p],
          existingByPlatform[p] ?? []
        );
  }
  return init;
}

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

function initialFacebookTypeRows(
  fullName: string,
  existing: TempSocialMediaAccount[]
): SetupAccountRow[] {
  if (existing.length) {
    return existing.map((a) => emptyRowFromExisting(fullName, a));
  }
  return [emptyAccountRow(fullName)];
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
  mode = "employee",
  cancelHref,
}: SetupFormProps) {
  const router = useRouter();
  const isManager = mode === "manager";
  const backHref = cancelHref ?? (isManager ? "/manager" : "/dashboard");
  const assignedPlatforms = useMemo(
    () =>
      PLATFORMS.filter((p) =>
        isFacebookPlatform(p)
          ? facebookRequiredTarget(targets) > 0
          : targets[p] > 0
      ),
    [targets]
  );

  const steps = useMemo(
    () => buildSetupSteps(assignedPlatforms),
    [assignedPlatforms]
  );

  const totalTarget = useMemo(() => {
    const other = PLATFORMS.filter((p) => !isFacebookPlatform(p)).reduce(
      (sum, p) => sum + targets[p],
      0
    );
    return other + facebookRequiredTarget(targets);
  }, [targets]);

  const [rowsByPlatform, setRowsByPlatform] = useState<
    Record<Platform, SetupAccountRow[]>
  >(() =>
    buildInitialRowsByPlatform(
      fullName,
      assignedPlatforms,
      targets,
      existingByPlatform
    )
  );

  const [profile, setProfile] = useState<SetupProfile>(initialProfile);
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<FormState>({ error: null });
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [errorScrollToken, setErrorScrollToken] = useState(0);
  const [pending, startTransition] = useTransition();
  const [hydratedUserId, setHydratedUserId] = useState<number | null>(null);
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const existingSignature = useMemo(
    () => setupExistingSignature(existingByPlatform),
    [existingByPlatform]
  );

  const persistDraft = useCallback(
    (
      nextProfile: SetupProfile,
      nextRows: Record<Platform, SetupAccountRow[]>,
      nextStepIndex: number
    ) => {
      writeSetupDraft({
        version: 1,
        userId,
        stepIndex: nextStepIndex,
        profile: { ...nextProfile, country: initialProfile.country },
        rowsByPlatform: nextRows,
        targets,
        existingSignature,
      });
    },
    [userId, initialProfile.country, targets, existingSignature]
  );

  const draftReady = isClient && hydratedUserId === userId;

  const persistArmedRef = useRef(false);

  useEffect(() => {
    if (!draftReady) {
      persistArmedRef.current = false;
      return;
    }
    if (!persistArmedRef.current) {
      persistArmedRef.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      persistDraft(profile, rowsByPlatform, stepIndex);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftReady, persistDraft, profile, rowsByPlatform, stepIndex]);

  useEffect(() => {
    if (!draftReady) return;
    function flush() {
      persistDraft(profile, rowsByPlatform, stepIndex);
    }
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [draftReady, persistDraft, profile, rowsByPlatform, stepIndex]);

  const rowFieldErrors = useMemo(
    () => getSetupRowFieldErrors(assignedPlatforms, rowsByPlatform, targets),
    [assignedPlatforms, rowsByPlatform, targets]
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

  const stillMissing = useMemo(
    () => Math.max(0, totalTarget - totalSavedAccounts),
    [totalSavedAccounts, totalTarget]
  );

  const countsMatchTargets = useMemo(() => {
    const counts: Record<Platform, number> = {
      x: rowsByPlatform.x.filter((row) => isSetupAccountRowComplete(row, "x"))
        .length,
      facebook_personal: rowsByPlatform.facebook_personal.filter((row) =>
        isSetupAccountRowComplete(row, "facebook_personal")
      ).length,
      facebook_umbrella: rowsByPlatform.facebook_umbrella.filter((row) =>
        isSetupAccountRowComplete(row, "facebook_umbrella")
      ).length,
      instagram: rowsByPlatform.instagram.filter((row) =>
        isSetupAccountRowComplete(row, "instagram")
      ).length,
      tiktok: rowsByPlatform.tiktok.filter((row) =>
        isSetupAccountRowComplete(row, "tiktok")
      ).length,
    };
    return accountsMeetTargets(counts, targets);
  }, [rowsByPlatform, targets]);

  if (isClient && hydratedUserId !== userId) {
    const draft = readSetupDraft(userId);
    const reusableDraft =
      draft && isSetupDraftReusable(draft, { userId, targets, existingSignature })
        ? draft
        : null;
    const nextProfile = reusableDraft
      ? { ...reusableDraft.profile, country: initialProfile.country }
      : hydratedUserId !== null
        ? initialProfile
        : profile;
    const nextRows = reusableDraft
      ? reusableDraft.rowsByPlatform
      : hydratedUserId !== null
        ? buildInitialRowsByPlatform(
            fullName,
            assignedPlatforms,
            targets,
            existingByPlatform
          )
        : rowsByPlatform;
    const nextProfileErrors = getSetupProfileFieldErrors(nextProfile);
    const nextRowErrors = getSetupRowFieldErrors(
      assignedPlatforms,
      nextRows,
      targets
    );
    const nextStepIndex = resumeSetupStepIndex(
      steps,
      nextProfileErrors,
      nextRowErrors,
      nextRows,
      targets
    );

    if (reusableDraft) {
      setProfile(nextProfile);
      setRowsByPlatform(nextRows);
    } else {
      if (draft) clearSetupDraft(userId);
      if (hydratedUserId !== null) {
        setProfile(nextProfile);
        setRowsByPlatform(nextRows);
      }
    }
    setStepIndex(nextStepIndex);
    setHydratedUserId(userId);
  }

  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[safeStepIndex];
  const isFirstStep = safeStepIndex <= 0;
  const isLastStep = safeStepIndex >= steps.length - 1;

  function revealFieldErrors() {
    setShowFieldErrors(true);
    setErrorScrollToken((token) => token + 1);
  }

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
      if (isFacebookPlatform(platform)) {
        if (facebookCompleteRowCount(prev) >= facebookRequiredTarget(targets)) {
          return prev;
        }
      } else if (rows.length >= targets[platform]) {
        return prev;
      }
      rows.push(emptyAccountRow(fullName));
      next[platform] = rows;
      persistDraft(profile, next, stepIndex);
      return next;
    });
  }

  function addOneRowForUnderTargetPlatforms(platforms: Platform[]) {
    setRowsByPlatform((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const platform of platforms) {
        const rows = [...(next[platform] ?? [])];
        if (isFacebookPlatform(platform)) {
          if (facebookCompleteRowCount(next) >= facebookRequiredTarget(targets)) {
            continue;
          }
        } else if (rows.length >= targets[platform]) {
          continue;
        }
        rows.push(emptyAccountRow(fullName));
        next[platform] = rows;
        changed = true;
      }
      if (changed) persistDraft(profile, next, stepIndex);
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
      persistDraft(profile, next, stepIndex);
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
    const ignored = ignoredFacebookRowIds(rowsByPlatform, targets);
    const accounts = assignedPlatforms.flatMap((platform) =>
      (rowsByPlatform[platform] ?? [])
        .filter((r) => !ignored.has(r.id))
        .map((r) => ({
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
    const nextIndex = Math.max(0, stepIndex - 1);
    persistDraft(profile, rowsByPlatform, nextIndex);
    setStepIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onNext() {
    if (!currentStep) return;
    setState({ error: null });
    persistDraft(profile, rowsByPlatform, stepIndex);

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
      const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
      persistDraft(profile, rowsByPlatform, nextIndex);
      setStepIndex(nextIndex);
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
    const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
    persistDraft(profile, rowsByPlatform, nextIndex);
    setStepIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave() {
    setState({ error: null });

    persistDraft(profile, rowsByPlatform, stepIndex);

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
      const payload = buildPayload();
      const res = isManager
        ? await saveEmployeeAccountsAsManager({
            employeeId: userId,
            language: payload.language,
            accounts: payload.accounts,
          })
        : await saveAccountsAction(formData);
      if (res?.error) {
        persistDraft(profile, rowsByPlatform, stepIndex);
        jumpToFirstErrorStep();
        revealFieldErrors();
        setState({ error: res.error });
        return;
      }
      clearSetupDraft(userId);
      if (isManager) {
        toast.success(
          `Setup complete for ${fullName}. All target accounts are saved.`
        );
        router.push("/manager");
        router.refresh();
      }
    });
  }

  function renderFacebookCard() {
    const facebookTarget = facebookRequiredTarget(targets);
    if (facebookTarget <= 0) return null;
    const poolComplete = facebookCompleteRowCount(rowsByPlatform);

    function facebookSection(platform: "facebook_personal" | "facebook_umbrella") {
      return {
        platform,
        targetCount: facebookTarget,
        poolComplete,
        existingAccounts: existingByPlatform[platform] ?? [],
        rows: rowsByPlatform[platform] ?? [],
        fieldErrors: displayedRowFieldErrors,
        onChangeRow: (idx: number, patch: Partial<SetupAccountRow>) =>
          updateRow(platform, idx, patch),
        onAddRow: () => addRow(platform),
        onRemoveRow: (idx: number) => removeRow(platform, idx),
      };
    }

    return (
      <FacebookAccountsCard
        personal={facebookSection("facebook_personal")}
        umbrella={facebookSection("facebook_umbrella")}
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
          hint={
            isManager
              ? "Country is assigned by admin — choose this account holder's language."
              : undefined
          }
        />
      );
    }

    if (currentStep.id === "facebook") {
      return renderFacebookCard();
    }

    return renderPlatformCard(currentStep.id);
  }

  if (!draftReady) {
    return <SetupDraftRestoring />;
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
          Let&apos;s set up {isManager ? `${fullName}'s` : "your"} accounts
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
          {isManager
            ? "Follow each step to add their work profile and social accounts."
            : "Follow each step to add your profile and social accounts."}
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
              <SetupCancelButton disabled={pending} href={backHref} />
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
