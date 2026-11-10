"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateManagerEmployeeProfile } from "@/actions/manager-employees";
import { SETUP_LANGUAGES } from "@/lib/setup-options";
import type { UpdateEmployeeTargetsPayload } from "@/types/admin";
import type {
  ManagerEmployeeEditButtonProps,
  ManagerHolderRow,
} from "@/types/manager";

const fieldClass =
  "w-full rounded-lg border border-[var(--color-hairline)] bg-[var(--color-cream-tint)] px-3 py-2.5 text-[15px] font-medium text-[var(--color-ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]";

const labelClass =
  "flex min-w-0 flex-col gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-muted)]";

const TARGET_FIELDS: {
  key: keyof UpdateEmployeeTargetsPayload;
  label: string;
}[] = [
  { key: "target_x_count", label: "X" },
  { key: "target_facebook_personal_count", label: "Facebook personal" },
  { key: "target_facebook_umbrella_count", label: "Facebook umbrella" },
  { key: "target_instagram_count", label: "Instagram" },
  { key: "target_tiktok_count", label: "TikTok" },
];

function EmployeeEditDialog({
  row,
  onClose,
}: {
  row: ManagerHolderRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(row.full_name);
  const [email, setEmail] = useState(row.email);
  const [language, setLanguage] = useState(row.language ?? "");
  const [targets, setTargets] = useState<UpdateEmployeeTargetsPayload>(
    row.targets,
  );
  const languages = SETUP_LANGUAGES as readonly string[];

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateManagerEmployeeProfile(row.id, {
        full_name: fullName,
        email,
        language,
        targets,
      });
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(`${fullName} updated.`);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
      onClick={(event) => event.stopPropagation()}
    >
      <motion.button
        type="button"
        aria-label="Close employee editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manager-employee-edit-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-2xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="manager-employee-edit-title"
              className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[26px]"
            >
              Edit employee
            </h2>
            <p className="mt-1 text-[14px] text-[var(--color-muted)]">
              {row.full_name} · {row.country}
            </p>
          </div>
          <motion.button
            type="button"
            aria-label="Close employee editor"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-muted)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Name
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={fieldClass}
              aria-label="Employee name"
            />
          </label>
          <label className={labelClass}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
              aria-label="Employee email"
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className={`${fieldClass} cursor-pointer`}
              aria-label="Employee language"
            >
              <option value="">No language</option>
              {language && !languages.includes(language) ? (
                <option value={language}>{language}</option>
              ) : null}
              {languages.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <h3 className="mt-6 text-[13px] font-semibold text-[var(--color-ink)]">
          Account targets
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TARGET_FIELDS.map((field) => (
            <label key={field.key} className={labelClass}>
              {field.label}
              <input
                type="number"
                min={0}
                max={10000}
                inputMode="numeric"
                value={targets[field.key]}
                onChange={(event) =>
                  setTargets((prev) => ({
                    ...prev,
                    [field.key]: Math.max(
                      0,
                      Math.floor(Number(event.target.value) || 0),
                    ),
                  }))
                }
                className={`${fieldClass} tabular-nums`}
                aria-label={`${field.label} target`}
              />
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[var(--color-hairline)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            Cancel
          </button>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={save}
            className="cursor-pointer rounded-lg bg-[var(--color-emerald)] px-4 py-2.5 text-[14px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/** Pencil on a team row: CM edits name, email, language and targets. */
export function ManagerEmployeeEditButton({
  row,
}: ManagerEmployeeEditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <button
          type="button"
          aria-label={`Edit ${row.full_name}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" strokeWidth={2} />
        </button>
      </motion.div>
      <AnimatePresence>
        {open ? (
          <EmployeeEditDialog row={row} onClose={() => setOpen(false)} />
        ) : null}
      </AnimatePresence>
    </>
  );
}
