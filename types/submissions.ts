import type { Platform, TempGrowth } from "@/types/db";

export type SubmissionMetric =
  | "followers"
  | "posts"
  | "retweets_with_content"
  | "replies"
  | "reels";

export type SubmissionRowPayload = {
  account_id: number;
  followers?: number;
  posts?: number;
  retweets_with_content?: number;
  replies?: number;
  reels?: number;
};

export type SubmissionPayload = {
  notes?: string;
  rows: SubmissionRowPayload[];
};

export type PlatformSubmissionAccount = {
  id: number;
  handle: string;
  url: string;
  current_followers: number;
};

export type PlatformSubmissionDrawerProps = {
  platform: Platform;
  accounts: PlatformSubmissionAccount[];
  existingSubmissions: TempGrowth[];
  open: boolean;
  onClose: () => void;
  onSubmitted?: (platform: Platform) => void;
};
