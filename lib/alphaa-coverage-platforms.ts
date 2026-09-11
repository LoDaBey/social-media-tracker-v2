import type { AlphaaExtraPlatformKey } from "@/types/admin";

/** Extended ALPHAA platforms shown on the ALPHAA admin tab (matches strategy keys). */
export const ALPHAA_EXTRA_PLATFORM_KEYS: AlphaaExtraPlatformKey[] = [
  "threads",
  "reddit",
  "youtube",
  "blogspot",
  "telegram",
  "website",
  "turkkitap",
  "kizlarsoruyor",
  "balatarin",
];

export const ALPHAA_EXTRA_PLATFORM_LABELS: Record<AlphaaExtraPlatformKey, string> = {
  threads: "Threads",
  reddit: "Reddit",
  youtube: "YouTube",
  blogspot: "BlogSpot",
  telegram: "Telegram",
  website: "Website",
  turkkitap: "1000Kitap",
  kizlarsoruyor: "KızlarSoruyor",
  balatarin: "Balatarin",
};

export function emptyAlphaaExtraPlatformCounts(): Record<
  AlphaaExtraPlatformKey,
  number
> {
  return {
    threads: 0,
    reddit: 0,
    youtube: 0,
    blogspot: 0,
    telegram: 0,
    website: 0,
    turkkitap: 0,
    kizlarsoruyor: 0,
    balatarin: 0,
  };
}

export function parseAlphaaExtraPlatformRow(
  row: Partial<Record<AlphaaExtraPlatformKey, string>>
): Record<AlphaaExtraPlatformKey, number> {
  const counts = emptyAlphaaExtraPlatformCounts();
  for (const key of ALPHAA_EXTRA_PLATFORM_KEYS) {
    counts[key] = Number(row[key] ?? 0);
  }
  return counts;
}
