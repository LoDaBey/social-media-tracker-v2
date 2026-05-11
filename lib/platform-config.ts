import { FaXTwitter, FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa6";

export type Platform =
  | "x"
  | "facebook_personal"
  | "facebook_umbrella"
  | "instagram"
  | "tiktok";

export type Metric =
  | "followers"
  | "posts"
  | "retweets_with_content"
  | "replies"
  | "reels";

export const PLATFORMS: Platform[] = [
  "x",
  "facebook_personal",
  "facebook_umbrella",
  "instagram",
  "tiktok",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: "X",
  facebook_personal: "Facebook (Personal)",
  facebook_umbrella: "Facebook (Umbrella)",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export const PLATFORM_TARGET_COLUMNS: Record<Platform, string> = {
  x: "target_x_count",
  facebook_personal: "target_facebook_personal_count",
  facebook_umbrella: "target_facebook_umbrella_count",
  instagram: "target_instagram_count",
  tiktok: "target_tiktok_count",
};

// Lucide / react-icons component per platform — used in cards & rows.
export const PLATFORM_ICONS = {
  x: FaXTwitter,
  facebook_personal: FaFacebook,
  facebook_umbrella: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
} as const;

// Soft tint used on the platform icon's background square.
export const PLATFORM_TINTS: Record<Platform, string> = {
  x: "#1A1A1A12", // soft black tint
  facebook_personal: "#1877F212",
  facebook_umbrella: "#1877F212",
  instagram: "#E4405F12",
  tiktok: "#1A1A1A12",
};

// Which metrics each platform's daily submission collects.
export const PLATFORM_METRICS: Record<Platform, Metric[]> = {
  x: ["followers", "posts", "retweets_with_content", "replies"],
  facebook_personal: ["followers", "posts", "replies", "reels"],
  facebook_umbrella: ["followers", "posts", "replies", "reels"],
  instagram: ["followers", "posts", "replies", "reels"],
  tiktok: ["followers", "reels"],
};

// Daily targets per platform per metric — placeholder values, admin will
// edit these later via the admin panel.
export const PLATFORM_DAILY_TARGETS: Record<
  Platform,
  Partial<Record<Metric, number>>
> = {
  x: { posts: 3, retweets_with_content: 5, replies: 10 },
  facebook_personal: { posts: 2, replies: 5, reels: 1 },
  facebook_umbrella: { posts: 2, replies: 5, reels: 1 },
  instagram: { posts: 1, replies: 3, reels: 2 },
  tiktok: { reels: 3 },
};

export const METRIC_LABELS: Record<Metric, string> = {
  followers: "Followers",
  posts: "Posts",
  retweets_with_content: "Retweets",
  replies: "Replies",
  reels: "Reels",
};

