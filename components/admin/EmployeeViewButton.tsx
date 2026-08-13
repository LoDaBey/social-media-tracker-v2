"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { getAdminEmployeeEditorBundle } from "@/actions/admin";
import { EmployeeEditModal } from "@/components/admin/EmployeeEditModal";
import type {
  AdminEmployeeEditorBundle,
  EmployeeViewButtonProps,
} from "@/types/admin";

export function EmployeeViewButton({
  employeeId,
  fullName,
  role,
}: EmployeeViewButtonProps) {
  const [open, setOpen] = useState(false);
  const [bundle, setBundle] = useState<AdminEmployeeEditorBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const next = await getAdminEmployeeEditorBundle(employeeId);
      if (!next) {
        setBundle(null);
        setError("This person could not be loaded.");
        return;
      }
      setBundle(next);
    } catch (e) {
      setBundle(null);
      setError(e instanceof Error ? e.message : "Could not load employee.");
    } finally {
      setLoading(false);
    }
  }

  function openEditor() {
    setOpen(true);
    void load();
  }

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`View and edit ${fullName}`}
          onClick={openEditor}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-emerald)] outline-none hover:bg-[var(--color-emerald-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Eye className="h-5 w-5" aria-hidden="true" strokeWidth={2} />
        </button>
      </motion.div>
      <EmployeeEditModal
        userId={employeeId}
        fullName={fullName}
        role={role}
        open={open}
        onClose={() => setOpen(false)}
        bundle={bundle}
        loading={loading}
        error={error}
        onReload={() => {
          void load();
        }}
      />
    </>
  );
}
