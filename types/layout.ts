import type { ReactNode } from "react";

export type SignOutOverlayProps = {
  visible: boolean;
};

export type BrandLogoSize = "header" | "login";

export type BrandLogoProps = {
  size?: BrandLogoSize;
  priority?: boolean;
};

export type AppTheme = "light" | "dark" | "system";

export type AppThemeProviderProps = {
  children: ReactNode;
};

export type ThemeToggleProps = {
  className?: string;
};
