"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { motion } from "framer-motion";
import { Check, Info, Lock, Minus, Plus, X } from "lucide-react";
import { submitPlatformBatch } from "@/actions/submissions";
import {
  drawerBackdropVariants,
  drawerPanelVariants,
  drawerRootVariants,
  setupButtonMotion,
} from "@/lib/setup-motion";
import {
  METRIC_LABELS,
  PLATFORM_DAILY_TARGETS,
  PLATFORM_ICONS,
  PLATFORM_LABELS,
  PLATFORM_METRICS,
  PLATFORM_TINTS,
} from "@/lib/platform-config";
import type { PlatformSubmissionDrawerProps, SubmissionMetric } from "@/types/submissions";

const EMPTY_VALUES: Record<SubmissionMetric, string> = {
  followers: "",
  posts: "",
  retweets_with_content: "",
  replies: "",
  reels: "",
};

function submittedValue(submission: PlatformSubmissionDrawerProps["existingSubmissions"][number], metric: SubmissionMetric) {
  return Number(submission[metric] ?? 0);
}

function inputId(accountId: number, metric: SubmissionMetric) {
  return `submission-${accountId}-${metric}`;
}

function clampNumeric(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function statusPill(
  accountList: PlatformSubmissionDrawerProps["accounts"],
  existingByAccountId: Map<number, PlatformSubmissionDrawerProps["existingSubmissions"][number]>
) {
  const total = accountList.length;
  if (total === 0) {
    return {
      label: "No accounts",
      className: "bg-[var(--color-cream)] text-[var(--color-muted)]",
    };
  }

  const sent = accountList.filter((account) => {
    const row = existingByAccountId.get(account.id);
    return Boolean(row && !row.is_auto_reset);
  }).length;

  if (sent === 0) {
    return {
      label: "Not sent yet",
      className: "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
    };
  }

  if (sent >= total) {
    return {
      label: "All sent",
      className: "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)]",
    };
  }

  return {
    label: `${total - sent} left to send`,
    className: "bg-[var(--color-cream)] text-[var(--color-muted)]",
  };
}

const MD_UP_QUERY = "(min-width: 768px)";

function subscribeMdUp(onChange: () => void) {
  const mq = window.matchMedia(MD_UP_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getMdUpSnapshot() {
  return window.matchMedia(MD_UP_QUERY).matches;
}

function useIsDesktopMd() {
  return useSyncExternalStore(subscribeMdUp, getMdUpSnapshot, () => true);
}

export function PlatformSubmissionDrawer({
  platform,
  accounts,
  existingSubmissions,
  open,
  onClose,
  onSubmitted,
}: PlatformSubmissionDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<number, Record<SubmissionMetric, string>>>({});
  const [isPending, startTransition] = useTransition();
  const isDesktop = useIsDesktopMd();

  const Icon = PLATFORM_ICONS[platform];
  const metrics = PLATFORM_METRICS[platform] as SubmissionMetric[];
  const targets = PLATFORM_DAILY_TARGETS[platform];
  const existingByAccountId = useMemo(() => {
    return new Map(existingSubmissions.map((submission) => [submission.social_media_account_id, submission]));
  }, [existingSubmissions]);
  const editableAccounts = accounts.filter((account) => !existingByAccountId.has(account.id));
  const submittedNotesForView = useMemo(() => {
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const submission of existingSubmissions) {
      const text = submission.notes?.trim();
      if (text && !seen.has(text)) {
        seen.add(text);
        parts.push(text);
      }
    }
    return parts.length > 0 ? parts.join("\n\n") : null;
  }, [existingSubmissions]);
  const pill = statusPill(accounts, existingByAccountId);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key !== "Tab" || !drawerRef.current) return;

      const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const activeFocusables = Array.from(focusables).filter(
        (element) => !element.hasAttribute("disabled") && element.offsetParent !== null
      );
      if (activeFocusables.length === 0) return;

      const first = activeFocusables[0];
      const last = activeFocusables[activeFocusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus?.();
    };
  }, [onClose, open]);

  function currentValue(accountId: number, metric: SubmissionMetric) {
    return values[accountId]?.[metric] ?? "";
  }

  function setMetricValue(accountId: number, metric: SubmissionMetric, value: string) {
    setValues((current) => ({
      ...current,
      [accountId]: {
        ...(current[accountId] ?? EMPTY_VALUES),
        [metric]: clampNumeric(value),
      },
    }));
  }

  function stepValue(accountId: number, metric: SubmissionMetric, delta: number) {
    const raw = currentValue(accountId, metric);
    const next = Math.max(0, Number(raw || 0) + delta);
    setMetricValue(accountId, metric, String(next));
  }

  function metricNumber(accountId: number, metric: SubmissionMetric) {
    const raw = currentValue(accountId, metric);
    return raw === "" ? undefined : Number(raw);
  }

  function submitRows() {
    return editableAccounts.map((account) => ({
      account_id: account.id,
      followers: metricNumber(account.id, "followers") ?? account.current_followers,
      posts: metricNumber(account.id, "posts"),
      retweets_with_content: metricNumber(account.id, "retweets_with_content"),
      replies: metricNumber(account.id, "replies"),
      reels: metricNumber(account.id, "reels"),
    }));
  }

  function submitBatch() {
    setError(null);
    const payload = { notes: notes.trim() || undefined, rows: submitRows() };

    startTransition(async () => {
      const result = await submitPlatformBatch(platform, payload);
      if (!result.ok) {
        setError(result.error ?? "Could not send. Try again.");
        return;
      }

      onSubmitted?.(platform);
      onClose();
    });
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] pointer-events-auto"
      variants={drawerRootVariants}
      initial="closed"
      animate="open"
      exit="closed"
      aria-hidden={!open}
    >
      <motion.button
        type="button"
        aria-label="Close submission drawer"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-[2px] outline-none"
        variants={drawerBackdropVariants}
      />

      <motion.section
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-submission-title"
        custom={isDesktop}
        variants={drawerPanelVariants}
        className={[
          "absolute flex bg-[var(--color-cream-tint)] shadow-[-24px_0_64px_rgba(20,20,20,.14)]",
          "inset-x-0 bottom-0 h-[92vh] flex-col rounded-t-[24px]",
          "md:inset-y-0 md:right-0 md:left-auto md:h-auto md:w-[720px] md:rounded-none lg:w-[960px] xl:w-[1040px]",
        ].join(" ")}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[var(--color-hairline)] md:hidden" />

        <div className="flex-1 overflow-y-auto pb-[96px]">
          <header className="p-7 pb-5">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px]"
                style={{ background: PLATFORM_TINTS[platform] }}
                aria-hidden="true"
              >
                <Icon className="text-[var(--color-ink)]" size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="platform-submission-title"
                  className="text-[24px] font-extrabold leading-tight text-[var(--color-ink)]"
                >
                  {PLATFORM_LABELS[platform]} update
                </h2>
                <p className="mt-1 text-[13px] font-medium text-[var(--color-muted)]">
                  {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
                </p>
              </div>

              <span
                className={[
                  "hidden rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-flex",
                  pill.className,
                ].join(" ")}
              >
                {pill.label}
              </span>

              <motion.button
                ref={closeButtonRef}
                type="button"
                aria-label="Close submission drawer"
                onClick={onClose}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                {...setupButtonMotion(false)}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </motion.button>
            </div>
          </header>

          <div className="h-px bg-[var(--color-hairline)]" />

          <section className="p-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-[18px] font-bold text-[var(--color-ink)]">
                Your numbers
              </h3>
              <div className="group relative">
                <motion.button
                  type="button"
                  aria-label="Show target information"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                  {...setupButtonMotion(false)}
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </motion.button>
                <div className="pointer-events-none absolute right-0 top-9 z-20 w-64 rounded-[12px] border border-[var(--color-hairline)] bg-white p-3 text-[12px] font-medium leading-5 text-[var(--color-muted)] opacity-0 shadow-[0_12px_32px_rgba(20,20,20,.08)] transition group-hover:opacity-100 group-focus-within:opacity-100">
                  Each column shows the goal at the top. After you send, that row locks until tomorrow.
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[16px] border border-[var(--color-hairline)] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 w-[140px] bg-white px-4 py-4 text-left align-bottom md:w-[200px]">
                        <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-ink)]">
                          Account
                        </span>
                      </th>
                      {metrics.map((metric) => (
                        <th
                          key={metric}
                          id={`metric-${metric}`}
                          className="w-[140px] px-4 py-4 text-left align-bottom"
                        >
                          <span className="block text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--color-ink)]">
                            {METRIC_LABELS[metric]}
                          </span>
                          {metric === "followers" ? null : targets[metric] ? (
                            <span className="mt-1 inline-flex rounded-full bg-[var(--color-emerald-tint)] px-2 py-1 text-[11px] font-medium text-[var(--color-emerald)]">
                              Target: {targets[metric]}
                            </span>
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={metrics.length + 1} className="px-4 py-8 text-center">
                          <p className="text-[14px] font-medium text-[var(--color-muted)]">
                            No accounts on this platform yet.{" "}
                            <a
                              href="/setup"
                              className="font-bold text-[var(--color-emerald)] underline-offset-4 hover:underline"
                            >
                              Add them in setup.
                            </a>
                          </p>
                        </td>
                      </tr>
                    ) : null}

                    {accounts.map((account, rowIndex) => {
                      const existing = existingByAccountId.get(account.id);
                      const isLocked = Boolean(existing);
                      const isAutoReset = Boolean(existing?.is_auto_reset);

                      return (
                        <tr
                          key={account.id}
                          className={[
                            rowIndex % 2 === 0 ? "bg-transparent" : "bg-[var(--color-cream-tint)]",
                            isAutoReset ? "border-l-[3px] border-[var(--color-coral)]" : "",
                            isLocked && !isAutoReset
                              ? "border-l-[3px] border-[var(--color-emerald)]"
                              : "",
                          ].join(" ")}
                        >
                          <td
                            className={[
                              "sticky left-0 z-10 border-t border-[var(--color-hairline)] px-4 py-4",
                              rowIndex % 2 === 0 ? "bg-white" : "bg-[var(--color-cream-tint)]",
                              isAutoReset ? "border-l-[3px] border-l-[var(--color-coral)]" : "",
                              isLocked && !isAutoReset
                                ? "border-l-[3px] border-l-[var(--color-emerald)]"
                                : "",
                            ].join(" ")}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <div
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px]"
                                style={{ background: PLATFORM_TINTS[platform] }}
                                aria-hidden="true"
                              >
                                {isLocked && !isAutoReset ? (
                                  <Check className="h-3.5 w-3.5 text-[var(--color-emerald)]" />
                                ) : (
                                  <Icon className="text-[var(--color-ink)]" size={13} />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-bold text-[var(--color-ink)]">
                                  {account.handle}
                                </p>
                                {isAutoReset ? (
                                  <p className="text-[11px] font-medium text-[var(--color-muted)]">
                                    Needs new numbers
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {metrics.map((metric) => {
                            const raw = currentValue(account.id, metric);
                            const numeric = raw === "" ? undefined : Number(raw);
                            const target = targets[metric] ?? 0;
                            const hasMetTarget =
                              metric !== "followers" && target > 0 && Number(numeric ?? 0) >= target;
                            const hasExceededTarget =
                              metric !== "followers" && target > 0 && Number(numeric ?? 0) > target;
                            const followersDelta =
                              metric === "followers" && numeric !== undefined
                                ? numeric - account.current_followers
                                : null;

                            return (
                              <td
                                key={metric}
                                className={[
                                  "border-t border-[var(--color-hairline)] px-4 py-4 align-top transition-colors",
                                  isLocked ? "opacity-70" : "",
                                  !isLocked && hasExceededTarget
                                    ? "bg-[#FFF5D8]"
                                    : !isLocked && hasMetTarget
                                      ? "bg-[var(--color-emerald-tint)]"
                                      : "",
                                ].join(" ")}
                              >
                                {isLocked ? (
                                  <div className="flex items-center justify-between gap-2 text-[18px] font-bold tabular-nums text-[var(--color-ink)]">
                                    <span>{isAutoReset ? 0 : submittedValue(existing!, metric)}</span>
                                    {metric === metrics[metrics.length - 1] ? (
                                      <Lock className="h-3.5 w-3.5 text-[var(--color-muted)]" />
                                    ) : null}
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center justify-center gap-2">
                                      <motion.button
                                        type="button"
                                        aria-label={`Decrease ${METRIC_LABELS[metric]} for ${account.handle}`}
                                        onClick={() => stepValue(account.id, metric, -1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-white text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                                        {...setupButtonMotion(false)}
                                      >
                                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                      </motion.button>
                                      <input
                                        id={inputId(account.id, metric)}
                                        aria-label={`${METRIC_LABELS[metric]} for ${account.handle}`}
                                        aria-describedby={`metric-${metric}`}
                                        inputMode="numeric"
                                        value={raw}
                                        placeholder={
                                          metric === "followers"
                                            ? formatNumber(account.current_followers)
                                            : "—"
                                        }
                                        onChange={(event) =>
                                          setMetricValue(account.id, metric, event.target.value)
                                        }
                                        className="w-16 rounded-lg bg-transparent text-center text-[18px] font-bold tabular-nums text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]/55 focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                                      />
                                      <motion.button
                                        type="button"
                                        aria-label={`Increase ${METRIC_LABELS[metric]} for ${account.handle}`}
                                        onClick={() => stepValue(account.id, metric, 1)}
                                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-white text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                                        {...setupButtonMotion(false)}
                                      >
                                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                      </motion.button>
                                    </div>

                                    {followersDelta !== null ? (
                                      <div className="mt-1 text-center">
                                        <span
                                          className={[
                                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                            followersDelta >= 0
                                              ? "bg-[#FFF5D8] text-[var(--color-gold)]"
                                              : "bg-[var(--color-coral-tint)] text-[var(--color-coral)]",
                                          ].join(" ")}
                                        >
                                          {followersDelta >= 0 ? "+" : "−"}
                                          {Math.abs(followersDelta)}
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {editableAccounts.length > 0 ? (
              <section className="mt-6 rounded-[14px] border border-[var(--color-hairline)] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(20,20,20,.04)]">
                <label
                  htmlFor="performance-summary"
                  className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]"
                >
                  Short note (optional)
                </label>
                <textarea
                  id="performance-summary"
                  value={notes}
                  maxLength={500}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything you want your lead to know..."
                  className="mt-2 min-h-24 w-full resize-none rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-3 text-[14px] font-normal text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                />
                <p className="text-right text-[11px] font-medium text-[var(--color-muted)]">
                  {notes.length}/500
                </p>
              </section>
            ) : submittedNotesForView ? (
              <section className="mt-6 rounded-[14px] border border-[var(--color-hairline)] bg-white px-[18px] py-4 shadow-[0_1px_2px_rgba(20,20,20,.04)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">
                  Your note
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[14px] font-normal leading-relaxed text-[var(--color-ink)]">
                  {submittedNotesForView}
                </p>
              </section>
            ) : null}
          </section>
        </div>

        <motion.footer
          layout
          transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
          className="absolute inset-x-0 bottom-0 border-t border-[var(--color-hairline)] bg-white"
        >
          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[12px] font-medium text-[var(--color-muted)]">
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                After you send, you cannot change until tomorrow.
              </p>
              {error ? (
                <p className="mt-1 text-[12px] font-semibold text-[var(--color-coral)]">{error}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-3">
              <motion.button
                type="button"
                aria-label="Close without sending"
                onClick={onClose}
                className="h-11 cursor-pointer rounded-lg px-4 text-[14px] font-semibold text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                {...setupButtonMotion(false)}
              >
                Close
              </motion.button>
              <motion.button
                type="button"
                aria-label={`Send ${editableAccounts.length} accounts`}
                disabled={editableAccounts.length === 0 || isPending}
                onClick={submitBatch}
                className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-emerald)] px-7 text-[14px] font-bold text-white outline-none hover:bg-[var(--color-emerald-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
                {...setupButtonMotion(editableAccounts.length === 0 || isPending)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {isPending
                  ? "Sending..."
                  : editableAccounts.length === 0
                    ? "Nothing to send"
                    : editableAccounts.length === 1
                      ? "Send 1 account"
                      : `Send ${editableAccounts.length} accounts`}
              </motion.button>
            </div>
          </div>
        </motion.footer>
      </motion.section>
    </motion.div>
  );
}
