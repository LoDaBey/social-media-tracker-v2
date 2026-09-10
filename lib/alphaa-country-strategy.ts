/**
 * ALPHAA strategic countries — project-level account architecture.
 * Platform keys use spreadsheet naming; the app maps `twitter` → X targets.
 */

export type AlphaaAccountScope = "personal" | "umberlla";

export type AlphaaPlatformCounts = Partial<
  Record<
    | "twitter"
    | "facebook"
    | "instagram"
    | "threads"
    | "reddit"
    | "blogspot"
    | "youtube"
    | "tiktok"
    | "okru"
    | "vk"
    | "pinterest"
    | "turkkitap"
    | "kizlarsoruyor"
    | "telegram"
    | "blogsky"
    | "balatarin"
    | "website"
    | "virasty",
    number
  >
>;

export type AlphaaCountryKey =
  | "sudan"
  | "somalia"
  | "palestine"
  | "turkey"
  | "iran";

export const ALPHAA_COUNTRY_LABELS: Record<AlphaaCountryKey, string> = {
  sudan: "Sudan",
  somalia: "Somalia",
  palestine: "Palestine",
  turkey: "Turkey",
  iran: "Iran",
};

/** Per-handler slot mix (personal vs umbrella). */
export const requiredAccounts: Record<
  AlphaaCountryKey,
  Record<AlphaaAccountScope, AlphaaPlatformCounts>
> = {
  turkey: {
    umberlla: {
      twitter: 1,
      facebook: 1,
      instagram: 1,
      threads: 1,
      reddit: 1,
      blogspot: 1,
      youtube: 1,
      pinterest: 1,
      turkkitap: 1,
      kizlarsoruyor: 1,
    },
    personal: {
      twitter: 13,
      facebook: 2,
      instagram: 2,
      threads: 2,
      reddit: 2,
      youtube: 0,
      tiktok: 2,
      turkkitap: 2,
    },
  },
  palestine: {
    umberlla: {
      twitter: 10,
      facebook: 1,
      instagram: 2,
      threads: 1,
      telegram: 1,
      reddit: 0,
      blogspot: 1,
      youtube: 1,
      tiktok: 1,
    },
    personal: {
      twitter: 10,
      facebook: 1,
      tiktok: 1,
      blogspot: 1,
      threads: 1,
      instagram: 2,
      telegram: 1,
      youtube: 1,
    },
  },
  iran: {
    umberlla: {
      tiktok: 1,
      facebook: 1,
      twitter: 1,
      instagram: 1,
      threads: 1,
      reddit: 1,
      blogsky: 0,
      youtube: 1,
      pinterest: 0,
      balatarin: 1,
      website: 1,
    },
    personal: {
      twitter: 12,
      facebook: 2,
      tiktok: 2,
      instagram: 2,
      threads: 2,
      reddit: 1,
      blogsky: 0,
      virasty: 0,
      youtube: 0,
      balatarin: 3,
    },
  },
  sudan: {
    umberlla: {
      twitter: 10,
      facebook: 1,
      instagram: 0,
      threads: 0,
      tiktok: 0,
      youtube: 0,
      blogspot: 0,
    },
    personal: {
      twitter: 11,
      facebook: 2,
      instagram: 2,
      threads: 0,
      tiktok: 2,
      youtube: 0,
      blogspot: 0,
    },
  },
  somalia: {
    umberlla: {
      twitter: 1,
      facebook: 1,
      instagram: 1,
      threads: 1,
      tiktok: 1,
      youtube: 1,
      reddit: 0,
      blogspot: 0,
    },
    personal: {
      twitter: 11,
      facebook: 3,
      tiktok: 1,
      instagram: 1,
      threads: 1,
      reddit: 0,
      youtube: 1,
      blogspot: 0,
    },
  },
};

/** Project-level strategy totals by country. */
export const requiredProjectStrategy: Record<
  AlphaaCountryKey,
  AlphaaPlatformCounts
> = {
  turkey: {
    twitter: 47,
    facebook: 9,
    instagram: 9,
    threads: 9,
    reddit: 9,
    youtube: 1,
    tiktok: 4,
    blogspot: 5,
    pinterest: 1,
    turkkitap: 9,
    kizlarsoruyor: 5,
  },
  palestine: {
    twitter: 31,
    facebook: 4,
    instagram: 6,
    threads: 3,
    blogspot: 3,
    youtube: 5,
    tiktok: 3,
    telegram: 1,
  },
  iran: {
    twitter: 88,
    facebook: 18,
    instagram: 18,
    threads: 22,
    reddit: 11,
    youtube: 4,
    tiktok: 18,
    balatarin: 28,
    website: 4,
  },
  sudan: {
    twitter: 132,
    facebook: 24,
    tiktok: 24,
  },
  somalia: {
    twitter: 76,
    facebook: 20,
    instagram: 9,
    threads: 9,
    reddit: 0,
    youtube: 9,
    tiktok: 9,
    blogspot: 7,
    website: 2,
  },
};

/** Project totals split by personal vs umbrella — drives admin coverage plans. */
export const requiredProjectStrategyPerCategory: Record<
  AlphaaCountryKey,
  Record<AlphaaAccountScope, AlphaaPlatformCounts>
> = {
  sudan: {
    personal: {
      twitter: 120,
      facebook: 12,
      tiktok: 24,
    },
    umberlla: {
      twitter: 12,
      facebook: 12,
      website: 0,
      tiktok: 0,
    },
  },
  turkey: {
    personal: {
      twitter: 42,
      facebook: 4,
      instagram: 4,
      threads: 4,
      reddit: 4,
      tiktok: 2,
    },
    umberlla: {
      website: 1,
      twitter: 5,
      facebook: 5,
      instagram: 5,
      threads: 5,
      youtube: 1,
      reddit: 5,
      blogspot: 5,
      tiktok: 2,
      pinterest: 1,
      turkkitap: 9,
      kizlarsoruyor: 5,
    },
  },
  iran: {
    personal: {
      twitter: 77,
      facebook: 7,
      instagram: 7,
      threads: 11,
      reddit: 7,
      pinterest: 0,
      blogspot: 0,
      youtube: 0,
      tiktok: 14,
    },
    umberlla: {
      website: 4,
      twitter: 11,
      facebook: 11,
      instagram: 11,
      threads: 11,
      youtube: 4,
      reddit: 4,
      blogspot: 0,
      tiktok: 4,
      pinterest: 0,
      telegram: 0,
      turkkitap: 0,
      balatarin: 28,
      kizlarsoruyor: 0,
    },
  },
  palestine: {
    personal: {
      twitter: 30,
      facebook: 3,
      instagram: 3,
      threads: 3,
      reddit: 0,
      pinterest: 0,
      blogspot: 3,
      youtube: 3,
      tiktok: 3,
    },
    umberlla: {
      website: 0,
      twitter: 1,
      facebook: 1,
      instagram: 3,
      threads: 0,
      youtube: 2,
      reddit: 0,
      blogspot: 0,
      tiktok: 0,
      telegram: 1,
    },
  },
  somalia: {
    personal: {
      twitter: 74,
      facebook: 18,
      instagram: 7,
      threads: 7,
      pinterest: 0,
      blogspot: 7,
      youtube: 7,
      tiktok: 7,
    },
    umberlla: {
      website: 2,
      twitter: 2,
      facebook: 2,
      instagram: 2,
      threads: 2,
      youtube: 2,
      reddit: 0,
      blogspot: 0,
      tiktok: 2,
      pinterest: 0,
      telegram: 0,
      turkkitap: 0,
      balatarin: 0,
      kizlarsoruyor: 0,
    },
  },
};

/** Planned employee seats per ALPHAA country. */
export const ALPHAA_COUNTRY_RESOURCES: Record<AlphaaCountryKey, number> = {
  sudan: 12,
  somalia: 7,
  palestine: 3,
  turkey: 4,
  iran: 7,
};

export const ALPHAA_COUNTRY_LANGUAGES: Record<AlphaaCountryKey, string> = {
  sudan: "Arabic",
  somalia: "Somali",
  palestine: "Arabic",
  turkey: "Turkish",
  iran: "Persian",
};
