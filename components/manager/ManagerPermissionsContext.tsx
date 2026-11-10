"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ManagerPermissions } from "@/types/manager";

const ALL = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
};

const ManagerPermissionsContext = createContext<ManagerPermissions>({
  team: ALL,
  coverage: ALL,
  spare: ALL,
});

/** The signed-in Country Manager's Access matrix, for hiding buttons they can't use. */
export function ManagerPermissionsProvider({
  value,
  children,
}: {
  value: ManagerPermissions;
  children: ReactNode;
}) {
  return (
    <ManagerPermissionsContext.Provider value={value}>
      {children}
    </ManagerPermissionsContext.Provider>
  );
}

export function useManagerPermissions(): ManagerPermissions {
  return useContext(ManagerPermissionsContext);
}
