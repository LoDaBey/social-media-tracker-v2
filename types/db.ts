export type Role = "employee" | "team_lead" | "admin";

export type Platform =
  | "x"
  | "facebook_personal"
  | "facebook_umbrella"
  | "instagram"
  | "tiktok";

export type TempUser = {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role: Role;
  phone: string | null;
  is_active: boolean;

  base_salary: string;
  /** Postgres DATE — `pg` may return a string or a `Date`. */
  pay_cycle_start_date: string | Date | null;
  hire_date: string;

  current_level: number;

  team_lead_id: number | null;

  target_x_count: number;
  target_facebook_personal_count: number;
  target_facebook_umbrella_count: number;
  target_instagram_count: number;
  target_tiktok_count: number;

  created_at: string;
  updated_at: string;
};

export type TempSocialMediaAccount = {
  id: number;
  user_id: number;

  platform: Platform;
  account_name: string;
  account_handle: string | null;
  account_url: string;

  starting_followers: number;
  current_followers: number;

  status: "active" | "archived" | "suspended";

  created_at: string;
  updated_at: string;
};

export type TempGrowth = {
  id: number;
  user_id: number;
  social_media_account_id: number;

  submission_date: string;

  followers: number;
  posts: number;
  retweets_with_content: number;
  replies: number;
  reels: number;
  notes: string | null;

  target_followers: number;
  target_posts: number;
  target_retweets_with_content: number;
  target_replies: number;
  target_reels: number;

  is_auto_reset: boolean;
  submitted_at: string | null;

  qc_status:
    | "pending"
    | "approved"
    | "rejected_with_deduction"
    | "rejected_no_deduction";
  qc_decision_amount: string;
  qc_comment: string | null;
  qc_reviewed_by: number | null;
  qc_reviewed_at: string | null;

  created_at: string;
  updated_at: string;
};

