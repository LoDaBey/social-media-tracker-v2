"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IdCard } from "lucide-react";
import { AdminEmployeeCodeModal } from "@/components/admin/AdminEmployeeCodeModal";
import type { EmployeeCodeButtonProps } from "@/types/admin";

export function EmployeeCodeButton({
  employeeId,
  fullName,
  employeeCode,
}: EmployeeCodeButtonProps) {
  const [open, setOpen] = useState(false);

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
          aria-label={`Set employee code for ${fullName}`}
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
        >
          <IdCard className="h-5 w-5" aria-hidden="true" />
        </button>
      </motion.div>
      <AdminEmployeeCodeModal
        open={open}
        employeeId={employeeId}
        fullName={fullName}
        employeeCode={employeeCode}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
