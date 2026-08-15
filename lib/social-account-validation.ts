import { z } from "zod";
import {
  isPlatformAccountUrl,
  isValidAccountEmail,
  isValidAccountUrl,
  platformUrlErrorMessage,
  setupAccountFieldsSchemaFor,
} from "@/lib/setup-schema";
import { publicAdminMutationError } from "@/lib/admin-action-error";
import type { AdminSocialAccountInput } from "@/types/admin";

const platformSchema = z.enum([
  "x",
  "facebook_personal",
  "facebook_umbrella",
  "instagram",
  "tiktok",
]);

const inputSchema = z.object({
  platform: platformSchema,
  accountHolder: z.string().trim().min(1, "Add an account holder."),
  url: z.string().trim().min(1, "Add a URL."),
  category: z.string().trim().min(1, "Select a category."),
  username: z.string().trim().min(1, "Add a username."),
  email: z.string().trim().min(1, "Add an email."),
  accountPassword: z.string().min(1, "Add an account password."),
  emailPassword: z.string().min(1, "Add an email password."),
  mobileNumber: z.string().trim().min(1, "Add a mobile number."),
  status: z.enum(["active", "archived", "suspended"]).optional(),
});

export function validateSocialAccountInput(
  payload: AdminSocialAccountInput
): { error: string } | { data: AdminSocialAccountInput } {
  const parsed = inputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: publicAdminMutationError(parsed.error) };
  }
  const data = parsed.data;
  const fields = setupAccountFieldsSchemaFor(data.platform).safeParse({
    accountHolder: data.accountHolder,
    url: data.url,
    category: data.category,
    username: data.username,
    email: data.email,
    accountPassword: data.accountPassword,
    emailPassword: data.emailPassword,
    mobileNumber: data.mobileNumber,
  });
  if (!fields.success) {
    return { error: publicAdminMutationError(fields.error) };
  }
  if (!isValidAccountUrl(data.url)) {
    return { error: "Use a valid http(s) URL." };
  }
  if (!isPlatformAccountUrl(data.platform, data.url)) {
    return { error: platformUrlErrorMessage(data.platform) };
  }
  if (!isValidAccountEmail(data.email)) {
    return { error: "Use a valid email." };
  }
  return { data };
}

export function uniqueAccountUrlError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return "This account URL already exists for this person.";
  }
  return publicAdminMutationError(error);
}
