import { ManagerCoveragePanel } from "@/components/manager/ManagerCoveragePanel";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import { ManagerHomeTabs } from "@/components/manager/ManagerHomeTabs";
import { ManagerSpareButton } from "@/components/manager/ManagerSpareButton";
import { ManagerPermissionsProvider } from "@/components/manager/ManagerPermissionsContext";
import type { ManagerHomeProps } from "@/types/manager";

const noAccess = (what: string) => (
  <p className="rounded-[16px] bg-[var(--color-cream-tint)] px-4 py-10 text-center text-[14px] text-[var(--color-muted)]">
    You don&apos;t have access to {what}. Ask an admin to change your Access.
  </p>
);

export function ManagerHome({
  groups,
  permissions,
  coverage,
  spareAccounts,
  spareHolders,
}: ManagerHomeProps) {
  return (
    <ManagerPermissionsProvider value={permissions}>
      <ManagerHomeTabs
        actions={
          permissions.spare.canRead ? (
            <ManagerSpareButton
              accounts={spareAccounts}
              holders={spareHolders}
            />
          ) : null
        }
        teamPanel={
          permissions.team.canRead ? (
            <ManagerHomeTable groups={groups} />
          ) : (
            noAccess("your team")
          )
        }
        coveragePanel={
          permissions.coverage.canRead ? (
            <ManagerCoveragePanel coverage={coverage} />
          ) : null
        }
      />
    </ManagerPermissionsProvider>
  );
}
