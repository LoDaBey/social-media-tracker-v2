"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { adminRoleBadge } from "@/lib/admin-view";
import { AdminEmployeeActivityList } from "@/components/admin/AdminEmployeeActivityList";
import { AdminEmployeeWalletView } from "@/components/admin/AdminEmployeeWalletView";
import { EmployeeEditModalTabs } from "@/components/admin/EmployeeEditModalTabs";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { EmployeeTargetsForm } from "@/components/admin/EmployeeTargetsForm";
import type {
  AdminEmployeePanel,
  EmployeeEditModalProps,
} from "@/types/admin";

function EmployeeEditModalFrame({
  userId,
  fullName,
  role,
  onClose,
  bundle,
  loading,
  error,
  onReload,
}: Omit<EmployeeEditModalProps, "open">) {
  const [panel, setPanel] = useState<AdminEmployeePanel>("profile");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const title = bundle?.fullName ?? fullName;
  const roleBadge = adminRoleBadge(bundle?.role ?? role);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      role="presentation"
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
        aria-labelledby="employee-edit-modal-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 my-4 w-full max-w-5xl rounded-[20px] bg-[var(--color-surface)] p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2
                id="employee-edit-modal-title"
                className="text-[22px] font-extrabold text-[var(--color-ink)] sm:text-[28px]"
              >
                {title}
              </h2>
              <span className="rounded-full bg-[var(--color-emerald-tint)] px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-emerald)]">
                {roleBadge}
              </span>
            </div>
          </div>
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label={`Close editor for ${title}`}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>

        <div className="mt-4">
          <EmployeeEditModalTabs panel={panel} onChange={setPanel} />
        </div>

        <div className="mt-5 min-h-[240px]" role="tabpanel">
          {loading && !bundle ? (
            <div className="min-h-[240px] animate-pulse rounded-2xl bg-[var(--color-cream-tint)]" />
          ) : error ? (
            <p className="rounded-lg bg-[var(--color-coral-tint)] px-4 py-3 text-[14px] text-[var(--color-coral)]">
              {error}
            </p>
          ) : bundle ? (
            <>
              {panel === "profile" ? (
                <EmployeeForm
                  key={bundle.profile.updated_at}
                  initial={bundle.profile}
                  teamLeads={bundle.teamLeads}
                  managers={bundle.managers}
                  embedded
                  onSaved={onReload}
                />
              ) : null}
              {panel === "targets" ? (
                <EmployeeTargetsForm
                  key={`${bundle.profile.updated_at}-targets`}
                  userId={userId}
                  initial={bundle.targets}
                  activeCounts={bundle.activeCounts}
                  embedded
                  onSaved={onClose}
                />
              ) : null}
              {panel === "wallet" ? (
                <AdminEmployeeWalletView
                  userId={userId}
                  fullName={bundle.fullName}
                  wallet={{
                    ...bundle.wallet,
                    cycleStart: bundle.wallet.cycleStart
                      ? new Date(bundle.wallet.cycleStart)
                      : null,
                    cycleEnd: bundle.wallet.cycleEnd
                      ? new Date(bundle.wallet.cycleEnd)
                      : null,
                  }}
                  transactions={bundle.transactions}
                  onWalletChanged={onReload}
                />
              ) : null}
              {panel === "activity" ? (
                <AdminEmployeeActivityList items={bundle.activity} />
              ) : null}
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

export function EmployeeEditModal({
  userId,
  fullName,
  role,
  open,
  onClose,
  bundle,
  loading,
  error,
  onReload,
}: EmployeeEditModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <EmployeeEditModalFrame
          key={userId}
          userId={userId}
          fullName={fullName}
          role={role}
          onClose={onClose}
          bundle={bundle}
          loading={loading}
          error={error}
          onReload={onReload}
        />
      ) : null}
    </AnimatePresence>
  );
}
