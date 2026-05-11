import type { Pool, PoolClient } from "pg";
import { pool } from "@/lib/db";
import type { TempNotificationRow } from "@/types/notifications";

export type CreateNotificationInput = {
  user_id: number;
  type: string;
  title: string;
  body: string;
  action_route?: string | null;
  metadata?: Record<string, unknown>;
  created_by?: number | null;
  category?: string | null;
};

export async function createNotification(
  client: Pool | PoolClient,
  input: CreateNotificationInput
): Promise<void> {
  await client.query(
    `INSERT INTO temp_notifications (
       user_id, type, category, title, body, action_route, metadata, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)`,
    [
      input.user_id,
      input.type,
      input.category ?? null,
      input.title,
      input.body,
      input.action_route ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.created_by ?? null,
    ]
  );
}

export async function getUnreadCount(userId: number): Promise<number> {
  const r = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM temp_notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return Number(r.rows[0]?.c ?? 0);
}

function rowFromDb(r: Record<string, unknown>): TempNotificationRow {
  const meta = r.metadata;
  return {
    id: Number(r.id),
    user_id: Number(r.user_id),
    type: String(r.type),
    category: r.category == null ? null : String(r.category),
    title: String(r.title),
    body: String(r.body),
    action_route: r.action_route == null ? null : String(r.action_route),
    metadata:
      meta && typeof meta === "object" && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : {},
    created_by: r.created_by == null ? null : Number(r.created_by),
    is_read: Boolean(r.is_read),
    read_at:
      r.read_at == null
        ? null
        : r.read_at instanceof Date
          ? r.read_at.toISOString()
          : String(r.read_at),
    created_at:
      r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

export async function listRecent(userId: number, limit = 10): Promise<TempNotificationRow[]> {
  const r = await pool.query(
    `SELECT id, user_id, type, category, title, body, action_route, metadata,
            created_by, is_read, read_at, created_at
       FROM temp_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
    [userId, limit]
  );
  return r.rows.map((row) => rowFromDb(row as Record<string, unknown>));
}

export async function markRead(userId: number, notificationId: number): Promise<boolean> {
  const r = await pool.query(
    `UPDATE temp_notifications
        SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
      WHERE id = $1 AND user_id = $2 AND is_read = FALSE`,
    [notificationId, userId]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function markAllRead(userId: number): Promise<number> {
  const r = await pool.query(
    `UPDATE temp_notifications
        SET is_read = TRUE, read_at = COALESCE(read_at, NOW())
      WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return r.rowCount ?? 0;
}
