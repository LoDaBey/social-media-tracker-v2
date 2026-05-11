"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, HelpCircle, XCircle } from "lucide-react";
import {
  approveSubmission,
  rejectNoDeduction,
  rejectWithDeduction,
} from "@/actions/qc";

type Option = "approve" | "reject_deduction" | "reject_no_deduction";

type Props = {
  growthId: number;
  employeeName: string;
};

const QUICK_PICKS = [100, 250, 500] as const;

export function QcDecisionForm({ growthId, employeeName }: Props) {
  const [lastGrowthId, setLastGrowthId] = useState(growthId);
  const [selected, setSelected] = useState<Option | null>(null);
  const [amount, setAmount] = useState<string>("250");
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (lastGrowthId !== growthId) {
    setLastGrowthId(growthId);
    setSelected(null);
    setAmount("250");
    setComment("");
    setError(null);
  }

  function setQuickPick(value: number | "custom") {
    if (value === "custom") return;
    setAmount(String(value));
  }

  function onAmountChange(raw: string) {
    const numeric = raw.replace(/[^\d]/g, "");
    setAmount(numeric);
  }

  function onConfirm() {
    if (!selected) return;
    setError(null);

    const trimmedComment = comment.trim() ? comment.trim() : undefined;

    startTransition(async () => {
      try {
        if (selected === "approve") {
          await approveSubmission(growthId, trimmedComment);
        } else if (selected === "reject_no_deduction") {
          await rejectNoDeduction(growthId, trimmedComment);
        } else {
          const numericAmount = Number(amount);
          if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError("Enter a deduction amount greater than zero.");
            return;
          }
          await rejectWithDeduction(growthId, numericAmount, trimmedComment);
        }
        setSelected(null);
        setComment("");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
      }
    });
  }

  function onSkip() {
    setSelected(null);
    setComment("");
    setError(null);
  }

  return (
    <div className="mt-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]">
        Decision
      </p>

      <div
        className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"
        role="radiogroup"
        aria-label="Choose a review decision"
      >
        <DecisionCard
          accent="emerald"
          icon={<CheckCircle className="h-4 w-4 text-[var(--color-emerald)]" aria-hidden="true" />}
          title="Approve"
          caption="Numbers look correct."
          isSelected={selected === "approve"}
          onSelect={() => setSelected("approve")}
        />

        <DecisionCard
          accent="coral"
          icon={<XCircle className="h-4 w-4 text-[var(--color-coral)]" aria-hidden="true" />}
          title="Reject — apply deduction"
          caption="Numbers are wrong or fabricated. Penalize the wallet."
          isSelected={selected === "reject_deduction"}
          onSelect={() => setSelected("reject_deduction")}
        >
          {selected === "reject_deduction" ? (
            <div className="mt-4 flex flex-col gap-3">
              <label
                htmlFor="qc-deduction-amount"
                className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]"
              >
                Deduction amount (EGP)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease deduction by 50"
                  onClick={() => onAmountChange(String(Math.max(0, Number(amount || 0) - 50)))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[16px] font-bold text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                >
                  −
                </button>
                <input
                  id="qc-deduction-amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => onAmountChange(event.target.value)}
                  aria-label="Deduction amount in EGP"
                  className="h-10 w-28 rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 text-center text-[16px] font-bold tabular-nums text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                />
                <button
                  type="button"
                  aria-label="Increase deduction by 50"
                  onClick={() => onAmountChange(String(Number(amount || 0) + 50))}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[16px] font-bold text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Quick deduction presets">
                {QUICK_PICKS.map((value) => {
                  const active = String(value) === amount;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-label={`Set deduction to ${value} EGP`}
                      onClick={() => setQuickPick(value)}
                      className={[
                        "cursor-pointer rounded-full px-3 py-1 text-[12px] font-semibold outline-none",
                        "focus-visible:ring-2 focus-visible:ring-[var(--color-coral)]",
                        active
                          ? "bg-[var(--color-coral)] text-white"
                          : "border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-coral-tint)]",
                      ].join(" ")}
                    >
                      {value}
                    </button>
                  );
                })}
                <span className="rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface)] px-3 py-1 text-[12px] font-semibold text-[var(--color-muted)]">
                  Custom
                </span>
              </div>
            </div>
          ) : null}
        </DecisionCard>

        <DecisionCard
          accent="cream"
          icon={<HelpCircle className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />}
          title="Reject — no deduction"
          caption="Honest mistake. Ask them to recheck next time."
          isSelected={selected === "reject_no_deduction"}
          onSelect={() => setSelected("reject_no_deduction")}
        />
      </div>

      <div
        className="mt-4 rounded-[14px] bg-[var(--color-cream-tint)]"
        style={{ padding: 16 }}
      >
        <label
          htmlFor="qc-comment"
          className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-muted)]"
        >
          Comment for the employee (optional)
        </label>
        <textarea
          id="qc-comment"
          value={comment}
          rows={4}
          onChange={(event) => setComment(event.target.value)}
          placeholder="e.g., Followers count seems off — please recount tomorrow."
          aria-label={`Optional comment for ${employeeName}`}
          className="mt-2 w-full resize-none rounded-lg bg-transparent text-[14px] font-normal text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        />
      </div>

      {error ? (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-coral-tint)] px-3 py-2"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 text-[var(--color-coral)]" aria-hidden="true" />
          <p className="text-[13px] font-medium text-[var(--color-coral)]">{error}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-hairline)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] font-medium text-[var(--color-muted)]">
          The employee will see your decision and any deduction in their wallet immediately.
        </p>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            aria-label="Skip this submission"
            onClick={onSkip}
            disabled={isPending}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-[14px] font-semibold text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Skip
          </motion.button>

          <motion.button
            type="button"
            aria-label="Confirm review decision"
            disabled={!selected || isPending}
            onClick={onConfirm}
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-5 py-2.5 text-[14px] font-bold text-white outline-none transition-colors hover:bg-[var(--color-emerald-hover)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            {isPending ? "Saving..." : "Confirm decision"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  accent: "emerald" | "coral" | "cream";
  icon: React.ReactNode;
  title: string;
  caption: string;
  isSelected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
};

function DecisionCard({
  accent,
  icon,
  title,
  caption,
  isSelected,
  onSelect,
  children,
}: CardProps) {
  const accentStyle =
    accent === "emerald"
      ? {
          border: "var(--color-emerald)",
          bg: "var(--color-emerald-tint)",
          square: "var(--color-emerald-tint)",
        }
      : accent === "coral"
        ? {
            border: "var(--color-coral)",
            bg: "var(--color-coral-tint)",
            square: "var(--color-coral-tint)",
          }
        : {
            border: "var(--color-muted)",
            bg: "var(--color-cream-tint)",
            square: "var(--color-cream-tint)",
          };

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <motion.div
      role="radio"
      aria-checked={isSelected}
      aria-label={`${title}: ${caption}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      layout
      whileHover={{ scale: isSelected ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={[
        "flex cursor-pointer flex-col items-start gap-3 rounded-[14px] outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]",
      ].join(" ")}
      style={{
        padding: 20,
        borderWidth: isSelected ? 2 : 1,
        borderStyle: "solid",
        borderColor: isSelected ? accentStyle.border : "var(--color-hairline)",
        backgroundColor: isSelected ? accentStyle.bg : "var(--color-surface)",
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[10px]"
        style={{ background: accentStyle.square }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <p className="text-[18px] font-extrabold text-[var(--color-ink)]">{title}</p>
        <p className="mt-1 text-[13px] font-normal text-[var(--color-muted)]">{caption}</p>
      </div>
      {children ? (
        <div
          className="w-full"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      ) : null}
    </motion.div>
  );
}
