"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { updateManagerEmployeeStatus } from "@/actions/manager-employees";
import {
  EMPLOYMENT_STATUSES,
  EMPLOYMENT_STATUS_LABELS,
} from "@/lib/employment-status";
import type { ManagerEmployeeStatusSelectProps } from "@/types/manager";
import type { EmploymentStatus } from "@/types/db";

const toneClass: Record<EmploymentStatus, string> = {
  active:
    "bg-[var(--color-emerald-tint)] text-[var(--color-emerald)] border-[var(--color-emerald)]/30",
  on_hold: "bg-[#E08A2C]/15 text-[#E08A2C] border-[#E08A2C]/30",
  deactivated:
    "bg-[var(--color-coral-tint)] text-[var(--color-coral)] border-[var(--color-coral)]/30",
};

export function ManagerEmployeeStatusSelect({
  employeeId,
  fullName,
  status,
}: ManagerEmployeeStatusSelectProps) {
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
      const result = await updateManagerEmployeeStatus(employeeId, next);
      if (result.error) {
        setValue(previous);
        toast.error(result.error);
        return;
      }
      toast.success(
        `${fullName} status updated to ${EMPLOYMENT_STATUS_LABELS[next]}.`
      );
      router.refresh();
    });
  }

  return (
    <select
      value={value}
      disabled={pending}
      aria-label={`Employment status for ${fullName}`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      onChange={(event) =>
        handleChange(event.target.value as EmploymentStatus)
      }
      className={`min-w-[120px] cursor-pointer rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold outline-none transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${toneClass[value]}`}
    >
      {EMPLOYMENT_STATUSES.map((option) => (
        <option key={option} value={option}>
          {EMPLOYMENT_STATUS_LABELS[option]}
        </option>
      ))}
    </select>
  );
}
