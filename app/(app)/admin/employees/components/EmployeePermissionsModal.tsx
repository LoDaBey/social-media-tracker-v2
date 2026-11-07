"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { ROLE_LABELS } from "@/lib/role-hierarchy";
import { useEmployeePermissions } from "@/hooks/useEmployeePermissions";
import { EmployeePermissionsMatrix } from "./EmployeePermissionsMatrix";
import type {
  AdminPagePermissionRow,
  AdminPermissionCrud,
  AdminPermissionPageKey,
  EmployeePermissionsModalProps,
} from "@/types/permissions";

function EmployeePermissionsModalFrame({
  userId,
  fullName,
  role,
  onClose,
}: Omit<EmployeePermissionsModalProps, "open">) {
  const { bundle, loading, saving, error, load, save, reset, clear } =
    useEmployeePermissions();
  const [pages, setPages] = useState<AdminPagePermissionRow[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void load(userId);
    return () => clear();
  }, [userId, load, clear]);

  useEffect(() => {
    if (bundle) {
      setPages(bundle.pages);
      setDirty(false);
    }
  }, [bundle]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, saving]);

  function handleChange(
    pageKey: AdminPermissionPageKey,
    next: AdminPermissionCrud
  ) {
    setPages((current) =>
      current.map((page) =>
        page.pageKey === pageKey ? { ...page, ...next } : page
      )
    );
    setDirty(true);
  }

  async function handleSave() {
    const result = await save({
      userId,
      pages: pages.map((page) => ({
        pageKey: page.pageKey,
        canCreate: page.canCreate,
        canRead: page.canRead,
        canUpdate: page.canUpdate,
        canDelete: page.canDelete,
      })),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Permissions saved for ${fullName}.`);
    setDirty(false);
  }

  async function handleReset() {
    const result = await reset(userId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Reset ${fullName} to role defaults.`);
    setDirty(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      role="presentation"
    >
      <motion.button
        type="button"
        aria-label="Close permissions dialog"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 cursor-pointer bg-black/50"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-permissions-title"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[20px] bg-[var(--color-surface)] shadow-xl sm:max-h-[calc(100vh-4rem)]"
      >
        <div className="shrink-0 border-b border-[var(--color-hairline)] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2
                id="employee-permissions-title"
                className="text-[20px] font-extrabold text-[var(--color-ink)] sm:text-[22px]"
              >
                Access · {fullName}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--color-muted)]">
                Role default: {ROLE_LABELS[role] ?? role}. Changes are stored
                per person and override the role matrix.
                {bundle?.isCustomized ? (
                  <span className="ml-1 font-semibold text-[var(--color-ink)]">
                    Customized.
                  </span>
                ) : (
                  <span className="ml-1">Using role defaults.</span>
                )}
              </p>
            </div>
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saving}
              onClick={onClose}
              aria-label="Close permissions dialog"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading && !bundle ? (
            <p className="py-8 text-center text-[14px] text-[var(--color-muted)]">
              Loading permissions…
            </p>
          ) : error && pages.length === 0 ? (
            <p
              role="alert"
              className="rounded-lg bg-[var(--color-cream-tint)] px-4 py-6 text-center text-[14px] font-medium text-[var(--color-coral)]"
            >
              {error}
            </p>
          ) : (
            <EmployeePermissionsMatrix
              pages={pages}
              disabled={saving || loading}
              onChange={handleChange}
            />
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--color-hairline)] px-5 py-4 sm:px-6">
          <motion.button
            type="button"
            layout
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={saving || loading || !bundle}
            onClick={() => {
              void handleReset();
            }}
            aria-label={`Reset ${fullName} permissions to role defaults`}
            className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Reset to role defaults
          </motion.button>
          <div className="flex flex-wrap gap-2">
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saving}
              onClick={onClose}
              aria-label="Cancel permission changes"
              className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--color-hairline)] px-4 text-[13px] font-semibold text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={saving || loading || !dirty || pages.length === 0}
              onClick={() => {
                void handleSave();
              }}
              aria-label={`Save permissions for ${fullName}`}
              className="inline-flex h-10 cursor-pointer items-center rounded-lg bg-[var(--color-emerald)] px-4 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving…" : "Save access"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function EmployeePermissionsModal({
  open,
  userId,
  fullName,
  role,
  onClose,
}: EmployeePermissionsModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <EmployeePermissionsModalFrame
          userId={userId}
          fullName={fullName}
          role={role}
          onClose={onClose}
        />
      ) : null}
    </AnimatePresence>
  );
}
