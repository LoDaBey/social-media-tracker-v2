import { z } from "zod";
import type { Platform } from "@/lib/platform-config";
import {
  SETUP_CATEGORIES,
  SETUP_COUNTRIES,
  SETUP_LANGUAGES,
} from "@/lib/setup-options";

/** Allowed host suffixes per platform (also matches subdomains like m.facebook.com). */
const PLATFORM_URL_HOST_SUFFIXES: Record<Platform, readonly string[]> = {
  x: ["x.com", "twitter.com"],
  facebook_personal: ["facebook.com", "fb.com", "fb.watch"],
  facebook_umbrella: ["facebook.com", "fb.com", "fb.watch"],
  instagram: ["instagram.com", "instagr.am"],
  tiktok: ["tiktok.com"],
};

export function isValidAccountUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hostnameMatchesAllowed(hostname: string, allowed: readonly string[]) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return allowed.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
}

export function isPlatformAccountUrl(platform: Platform, value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (!hostnameMatchesAllowed(url.hostname, PLATFORM_URL_HOST_SUFFIXES[platform])) {
      return false;
    }
    const path = url.pathname.replace(/\/+$/, "");
    // Require a profile/page path — bare homepage is not an account link.
    return Boolean(path && path !== "/");
  } catch {
    return false;
  }
}

export function platformUrlErrorMessage(platform: Platform) {
  switch (platform) {
    case "x":
      return "Use an X (Twitter) profile URL.";
    case "facebook_personal":
    case "facebook_umbrella":
      return "Use a Facebook profile or page URL.";
    case "instagram":
      return "Use an Instagram profile URL.";
    case "tiktok":
      return "Use a TikTok profile URL.";
  }
}

export function platformUrlPlaceholder(platform: Platform) {
  switch (platform) {
    case "x":
      return "https://x.com/username";
    case "facebook_personal":
    case "facebook_umbrella":
      return "https://facebook.com/username";
    case "instagram":
      return "https://instagram.com/username";
    case "tiktok":
      return "https://tiktok.com/@username";
  }
}

export function isValidAccountEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const setupAccountFieldsBaseSchema = z.object({
  accountHolder: z.string().trim().min(1, "Add an account holder."),
  url: z.string().trim().min(1, "Add a URL."),
  category: z
    .string()
    .trim()
    .min(1, "Select a category.")
    .refine(
      (value) => (SETUP_CATEGORIES as readonly string[]).includes(value),
      "Select a category."
    ),
  username: z.string().trim().min(1, "Add a username."),
  email: z
    .string()
    .trim()
    .min(1, "Add an email.")
    .refine((value) => isValidAccountEmail(value), "Use a valid email."),
  accountPassword: z.string().min(1, "Add an account password."),
  emailPassword: z.string().min(1, "Add an email password."),
  mobileNumber: z.string().trim().min(1, "Add a mobile number."),
});

export function setupAccountFieldsSchemaFor(platform: Platform) {
  return setupAccountFieldsBaseSchema.superRefine((data, ctx) => {
    const url = data.url.trim();
    if (!url) return;

    if (!isValidAccountUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Use a valid http(s) URL.",
      });
      return;
    }

    if (!isPlatformAccountUrl(platform, url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: platformUrlErrorMessage(platform),
      });
    }
  });
}

/** @deprecated Prefer setupAccountFieldsSchemaFor(platform) */
export const setupAccountFieldsSchema = setupAccountFieldsBaseSchema.superRefine(
  (data, ctx) => {
    const url = data.url.trim();
    if (!url) return;
    if (!isValidAccountUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Use a valid http(s) URL.",
      });
    }
  }
);

export const setupProfileSchema = z.object({
  country: z
    .string()
    .trim()
    .min(1, "Ask your admin to assign a country.")
    .refine(
      (value) => (SETUP_COUNTRIES as readonly string[]).includes(value),
      "Ask your admin to assign a country."
    ),
  language: z
    .string()
    .trim()
    .min(1, "Select a language.")
    .refine(
      (value) => (SETUP_LANGUAGES as readonly string[]).includes(value),
      "Select a language."
    ),
});

export const setupSaveAccountSchema = setupAccountFieldsBaseSchema
  .extend({
    platform: z.enum([
      "x",
      "facebook_personal",
      "facebook_umbrella",
      "instagram",
      "tiktok",
    ]),
  })
  .superRefine((data, ctx) => {
    const url = data.url.trim();
    if (!url) return;

    if (!isValidAccountUrl(url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Use a valid http(s) URL.",
      });
      return;
    }

    if (!isPlatformAccountUrl(data.platform, url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: platformUrlErrorMessage(data.platform),
      });
    }
  });

export const setupSavePayloadSchema = z.object({
  country: setupProfileSchema.shape.country,
  language: setupProfileSchema.shape.language,
  accounts: z.array(setupSaveAccountSchema),
});
