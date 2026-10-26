"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { AppThemeProviderProps } from "@/types/layout";

export function ThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
