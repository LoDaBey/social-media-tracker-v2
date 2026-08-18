"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { ManagerEmployeeEditModal } from "@/components/manager/ManagerEmployeeEditModal";
import type { ManagerEmployeeEditButtonProps } from "@/types/manager";

export function ManagerEmployeeEditButton({
  employeeId,
  fullName,
  employeeCode,
}: ManagerEmployeeEditButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-flex"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label={`Edit ${fullName}`}
          title={`Edit ${fullName}`}
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
      <ManagerEmployeeEditModal
        open={open}
        employeeId={employeeId}
        fullName={fullName}
        employeeCode={employeeCode}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
