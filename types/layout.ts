import type { ReactNode } from "react";
import type { Role } from "@/types/db";
import type {
  AdminEmployeeSource,
  AdminSpareAccountListItem,
  SpareMarkHolderOption,
} from "@/types/admin";
import type { AdminPermissionPageKey } from "@/types/permissions";

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

export type AppHeaderProps = {
  name: string;
  email: string;
  role: Role;
  roleLabel: string | null;
};

export type HeaderUserMenuProps = {
  name: string;
  email: string;
  role: Role;
  initials: string;
};

export type AdminHeaderNavLink = {
  href: string;
  label: string;
  match: "exact" | "prefix";
};

export type AdminHeaderNavProps = {
  spareCount: number;
  spareAccounts: AdminSpareAccountListItem[];
  spareHolders: SpareMarkHolderOption[];
  /** Page keys the viewer may read; controls which nav items appear. */
  allowedPages: AdminPermissionPageKey[];
};

export type AdminHeaderNavItemProps = {
  link: AdminHeaderNavLink;
  active: boolean;
};

export type AdminHeaderSpareButtonProps = {
  count: number;
  accounts: AdminSpareAccountListItem[];
  holders: SpareMarkHolderOption[];
  /** When false, the Spare nav control is hidden. */
  visible?: boolean;
};

export type CommandPalettePersonAccount = {
  name: string;
  platform: string;
  username: string | null;
  handle: string | null;
  url: string | null;
};

export type CommandPalettePerson = {
  id: number;
  source: AdminEmployeeSource;
  href: string;
  name: string;
  email: string;
  roleLabel: string;
  code: string | null;
  country: string | null;
  accounts: CommandPalettePersonAccount[];
};

export type CommandPaletteItemKind = "person" | "account";

export type CommandPaletteItem = {
  id: string;
  kind: CommandPaletteItemKind;
  title: string;
  subtitle: string;
  keywords?: string;
  href?: string;
};

export type CommandPaletteGroup = {
  id: string;
  label: string;
  items: CommandPaletteItem[];
};

export type HeaderSearchProps = {
  people: CommandPalettePerson[];
};

export type HeaderSearchPaletteProps = {
  people: CommandPalettePerson[];
  onClose: () => void;
};

export type HeaderSearchPaletteItemProps = {
  item: CommandPaletteItem;
  selected: boolean;
  onHover: () => void;
  onSelect: () => void;
};

export type HeaderSearchPaletteItemIconProps = {
  kind: CommandPaletteItemKind;
  title: string;
};
