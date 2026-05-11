import type { Platform, Role } from "@/types/db";

export type QcStatusFilter =
  | "pending"
  | "approved"
  | "rejected_with_deduction"
  | "rejected_no_deduction";

export type QcStatusGroup = "pending" | "approved" | "rejected";

export type QcQueueRow = {
  growth_id: number;
  user_id: number;
  employee_full_name: string;
  social_media_account_id: number;
  account_platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string;

  submission_date: string;

  followers: number;
  posts: number;
  retweets_with_content: number;
  replies: number;
  reels: number;

  target_followers: number;
  target_posts: number;
  target_retweets_with_content: number;
  target_replies: number;
  target_reels: number;

  notes: string | null;
  is_auto_reset: boolean;

  qc_status: QcStatusFilter;
  qc_decision_amount: string;
  qc_comment: string | null;
  qc_reviewed_by: number | null;
  qc_reviewed_at: string | null;

  submitted_at: string | null;
  created_at: string;
};

export type QcKpis = {
  pendingCount: number;
  reviewedTodayCount: number;
  rejectionRatePct: number;
};

export type QcSearchParams = {
  selected?: number;
  status: QcStatusGroup;
  platform?: Platform;
  q?: string;
};

export type QcReviewerRole = Extract<Role, "team_lead" | "admin">;

export type QcDecisionResult = {
  ok: true;
  growthId: number;
};
