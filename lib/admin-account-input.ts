import type {
  AdminSocialAccountInput,
  AdminSocialAccountListItem,
} from "@/types/admin";
import type { ManagerAccountListItem } from "@/types/manager";

export function emptyAdminSocialAccountInput(
  holderName: string
): AdminSocialAccountInput {
  return {
    platform: "x",
    accountHolder: holderName,
    url: "",
    category: "",
    username: "",
    email: "",
    accountPassword: "",
    emailPassword: "",
    mobileNumber: "",
    status: "active",
  };
}

export function adminSocialAccountToInput(
  account: AdminSocialAccountListItem
): AdminSocialAccountInput {
  return {
    platform: account.platform,
    accountHolder: account.account_handle ?? "",
    url: account.account_url,
    category: account.category ?? "",
    username: account.username ?? "",
    email: account.account_email ?? "",
    accountPassword: account.account_password ?? "",
    emailPassword: account.email_password ?? "",
    mobileNumber: account.mobile_number ?? "",
    status: account.status,
  };
}

export function managerAccountToInput(
  account: ManagerAccountListItem,
  holderId: number,
  holderName: string
): AdminSocialAccountInput {
  return {
    platform: account.platform,
    accountHolder: account.account_handle?.trim() || holderName,
    holderUserId: holderId,
    url: account.account_url,
    category: account.category ?? "",
    username: account.username ?? "",
    email: account.account_email ?? "",
    accountPassword: account.account_password ?? "",
    emailPassword: account.email_password ?? "",
    mobileNumber: account.mobile_number ?? "",
    status: account.status,
  };
}
