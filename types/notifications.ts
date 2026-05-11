export type NotificationType =
  | "submission_approved"
  | "submission_rejected"
  | "bonus_received"
  | "payout_processed"
  | "level_changed"
  | "targets_changed";

export type TempNotificationRow = {
  id: number;
  user_id: number;
  type: string;
  category: string | null;
  title: string;
  body: string;
  action_route: string | null;
  metadata: Record<string, unknown>;
  created_by: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type NotificationsApiResponse = {
  unreadCount: number;
  items: TempNotificationRow[];
};
