"use client";

import { setManagerSocialAccountSpare } from "@/actions/manager-accounts";
import { SpareAccountsButton } from "@/components/admin/SpareAccountsButton";
import type { SpareAccountsButtonProps } from "@/types/admin";

export function ManagerSpareButton({
  accounts,
  holders,
}: Pick<SpareAccountsButtonProps, "accounts" | "holders">) {
  return (
    <SpareAccountsButton
      accounts={accounts}
      holders={holders}
      setSpare={setManagerSocialAccountSpare}
      subtitle="Mark or unmark spare accounts for handlers in your countries. They stay on handlers but count as extras in KPIs."
    />
  );
}
