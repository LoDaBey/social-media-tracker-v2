import pkg from "pg";
const { Pool, types } = pkg;

// Keep PostgreSQL `DATE` (OID 1082) values as plain `YYYY-MM-DD` strings
// instead of JS Date objects. The default parser produces a Date in the
// server's local timezone, which then drifts a day when re-formatted in UTC
// (Cairo is UTC+3, so a stored `2026-05-11` would round-trip to `2026-05-10`).
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 5432,
  max: 150,
  idleTimeoutMillis: 30000,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Typed query helper — use this for all parameterized queries.
// Example: const rows = await query<TempUser>('SELECT * FROM temp_users WHERE id = $1', [id]);
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
