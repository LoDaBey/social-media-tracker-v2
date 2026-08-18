import { ManagerCoveragePanel } from "@/components/manager/ManagerCoveragePanel";
import { ManagerHomeTable } from "@/components/manager/ManagerHomeTable";
import { ManagerHomeTabs } from "@/components/manager/ManagerHomeTabs";
import type { ManagerHomeProps } from "@/types/manager";

export function ManagerHome({ groups, coverage }: ManagerHomeProps) {
  return (
    <ManagerHomeTabs
      teamPanel={<ManagerHomeTable groups={groups} />}
      coveragePanel={<ManagerCoveragePanel coverage={coverage} />}
    />
  );
}
