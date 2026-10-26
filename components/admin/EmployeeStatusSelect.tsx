"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setEmployeeEmploymentStatus } from "@/actions/admin";
import { setAlphaaEmployeeEmploymentStatus } from "@/actions/admin-alphaa";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
} from "@/lib/employment-status";
import type { EmployeeStatusSelectProps } from "@/types/admin";
import type { EmploymentStatus } from "@/types/db";

const toneClass: Record<EmploymentStatus, string> = {
  active:
    "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)] border-[var(--color-emerald)]/30",
  on_hold: "bg-[var(--color-amber)]/15 text-[var(--color-amber)] border-[var(--color-amber)]/30",
  deactivated:
    "bg-[var(--color-coral-tint)] text-[var(--color-coral)] border-[var(--color-coral)]/30",
};

export function EmployeeStatusSelect({
  userId,
  fullName,
  status,
  source = "temp",
}: EmployeeStatusSelectProps) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setValue(status);
  }, [status]);

  function handleChange(next: EmploymentStatus) {
    if (next === value) return;
    const previous = value;
    setValue(next);
    startTransition(async () => {
      try {
        if (source === "alphaa") {
          await setAlphaaEmployeeEmploymentStatus(userId, next);
        } else {
          await setEmployeeEmploymentStatus(userId, next);
        }
        toast.success(
          `${fullName} status updated to ${EMPLOYMENT_STATUS_LABELS[next]}.`
        );
        router.refresh();
      } catch (e) {
        setValue(previous);
        toast.error(e instanceof Error ? e.message : "Could not update status.");
      }
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      aria-label={`Employment status for ${fullName}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => handleChange(e.target.value as EmploymentStatus)}
      className={`min-w-[120px] cursor-pointer rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[value]}`}
    >
      {(source === "alphaa"
        ? (["active", "deactivated"] as const)
        : EMPLOYMENT_STATUSES
      ).map((option) => (
        <option key={option} value={option}>
          {EMPLOYMENT_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
