import { ManagerCoveragePanel } from "@/components/manager/ManagerCoveragePanel";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import { ManagerHomeTabs } from "@/components/manager/ManagerHomeTabs";
import { ManagerSpareButton } from "@/components/manager/ManagerSpareButton";
import type { ManagerHomeProps } from "@/types/manager";

export function ManagerHome({
  groups,
  coverage,
  spareAccounts,
  spareHolders,
}: ManagerHomeProps) {
  return (
    <ManagerHomeTabs
      actions={
        <ManagerSpareButton accounts={spareAccounts} holders={spareHolders} />
      }
      teamPanel={<ManagerHomeTable groups={groups} />}
      coveragePanel={<ManagerCoveragePanel coverage={coverage} />}
    />
  );
}
