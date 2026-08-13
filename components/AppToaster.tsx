"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: "var(--color-surface)",
          color: "var(--color-ink)",
          border: "1px solid var(--color-hairline)",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 12px 32px rgba(20,20,20,.08)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-emerald)",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-coral)",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
