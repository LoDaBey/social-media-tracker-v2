"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import type { StrategyUploadButtonProps } from "@/types/strategy";

export function StrategyUploadButton({ pending, onFile }: StrategyUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        aria-label="Upload strategy Excel file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
      <motion.button
        type="button"
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={pending}
        aria-label="Upload strategy Excel"
        onClick={() => inputRef.current?.click()}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--color-emerald)] px-4 py-2 text-[13px] font-semibold text-white outline-none hover:bg-[var(--color-emerald-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-emerald)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {pending ? "Importing…" : "Upload Excel"}
      </motion.button>
    </>
  );
}
