"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { EmployeePermissionsModal } from "./EmployeePermissionsModal";
import type { EmployeePermissionsButtonProps } from "@/types/permissions";

export function EmployeePermissionsButton({
  userId,
  fullName,
  role,
  source,
}: EmployeePermissionsButtonProps) {
  const [open, setOpen] = useState(false);

  if (source !== "temp") return null;

  return (
    <>
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Manage access for ${fullName}`}
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[var(--color-ink)] outline-none hover:bg-[var(--color-cream-tint)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)]"
      >
        <Shield className="h-4 w-4" aria-hidden="true" />
      </motion.button>
      <EmployeePermissionsModal
        open={open}
        userId={userId}
        fullName={fullName}
        role={role}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
