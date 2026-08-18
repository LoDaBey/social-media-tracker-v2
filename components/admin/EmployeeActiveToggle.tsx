"use client";

import { useTransition } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { setEmployeeActive } from "@/actions/admin";

type Props = {
  userId: number;
  fullName: string;
  isActive: boolean;
};

export function EmployeeActiveToggle({ userId, fullName, isActive }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      try {
        await setEmployeeActive(userId, !isActive);
        toast.success(
          !isActive
            ? `${fullName} can now access the dashboard.`
            : `${fullName} can no longer access the dashboard.`
        );
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not update dashboard access."
        );
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={
        isActive
          ? `Revoke dashboard access for ${fullName}`
          : `Grant dashboard access for ${fullName}`
      }
      disabled={pending}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          toggle(e);
        }
      }}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:opacity-40 ${
        isActive ? "bg-[var(--color-emerald)]" : "bg-[var(--color-hairline)]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] ${
          isActive ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
