import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import type { TempUser } from "../types/db";

dotenv.config({ path: ".env.local" });

function getTodayCairoDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

async function main() {
  const { pool, queryOne } = await import("../lib/db");
  const password = "admin123";
  const password_hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO temp_users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    ["Admin", "admin@temp.local", password_hash]
  );

  await pool.query(
    `INSERT INTO temp_users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'team_lead')
     ON CONFLICT (email) DO NOTHING`,
    ["Mariam (Team Lead)", "lead@temp.local", password_hash]
  );

  const lead = await queryOne<Pick<TempUser, "id">>(
    "SELECT id FROM temp_users WHERE email = $1",
    ["lead@temp.local"]
  );
  if (!lead) throw new Error("Team lead not found after seed insert/select.");

  await pool.query(
    `INSERT INTO temp_users (
       full_name,
       email,
       password_hash,
       role,
       team_lead_id,
       base_salary,
       current_level,
       pay_cycle_start_date,
       target_x_count,
       target_facebook_personal_count,
       target_facebook_umbrella_count,
       target_instagram_count,
       target_tiktok_count
     ) VALUES (
       $1,
       $2,
       $3,
       'employee',
       $4,
       $5,
       $6,
       CURRENT_DATE,
       $7,
       $8,
       $9,
       $10,
       $11
     )
     ON CONFLICT (email) DO UPDATE SET
       team_lead_id = EXCLUDED.team_lead_id,
       base_salary = EXCLUDED.base_salary,
       current_level = EXCLUDED.current_level,
       pay_cycle_start_date = EXCLUDED.pay_cycle_start_date,
       target_x_count = EXCLUDED.target_x_count,
       target_facebook_personal_count = EXCLUDED.target_facebook_personal_count,
       target_facebook_umbrella_count = EXCLUDED.target_facebook_umbrella_count,
       target_instagram_count = EXCLUDED.target_instagram_count,
       target_tiktok_count = EXCLUDED.target_tiktok_count`,
    [
      "Test Employee",
      "employee@temp.local",
      password_hash,
      lead.id,
      4500,
      3,
      5,
      1,
      1,
      2,
      1,
    ]
  );

  const employee = await queryOne<Pick<TempUser, "id">>(
    "SELECT id FROM temp_users WHERE email = $1",
    ["employee@temp.local"]
  );
  if (!employee) throw new Error("Employee not found after seed insert/select.");

  const seededAccounts = [
    ["x", "news_daily_eg", "@news_daily_eg", "https://x.com/news_daily_eg", 1200],
    ["x", "sports_today", "@sports_today", "https://x.com/sports_today", 820],
    ["x", "culture_cairo", "@culture_cairo", "https://x.com/culture_cairo", 1540],
    ["x", "tech_mena", "@tech_mena", "https://x.com/tech_mena", 980],
    ["x", "daily_deals_eg", "@daily_deals_eg", "https://x.com/daily_deals_eg", 2110],
    [
      "facebook_personal",
      "mariam_updates",
      "@mariam_updates",
      "https://facebook.com/mariam_updates",
      640,
    ],
    ["instagram", "cairo_spotlight", "@cairo_spotlight", "https://instagram.com/cairo_spotlight", 2400],
  ] as const;

  const accountIds: Record<string, number> = {};

  for (const [platform, accountName, handle, url, followers] of seededAccounts) {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO temp_social_media_accounts
        (user_id, platform, account_name, account_handle, account_url, starting_followers, current_followers, status)
       VALUES ($1, $2, $3, $4, $5, $6, $6, 'active')
       ON CONFLICT (user_id, platform, account_url) DO UPDATE SET
         account_name = EXCLUDED.account_name,
         account_handle = EXCLUDED.account_handle,
         starting_followers = EXCLUDED.starting_followers,
         current_followers = EXCLUDED.current_followers,
         status = 'active'
       RETURNING id`,
      [employee.id, platform, accountName, handle, url, followers]
    );
    if (row) accountIds[accountName] = row.id;
  }

  const todayCairoDate = getTodayCairoDate();
  await pool.query(
    `DELETE FROM temp_growth
     WHERE user_id = $1
       AND submission_date = $2::date
       AND social_media_account_id = ANY($3::int[])`,
    [employee.id, todayCairoDate, Object.values(accountIds)]
  );

  const growthRows = [
    {
      accountId: accountIds.mariam_updates,
      followers: 640,
      posts: 0,
      retweetsWithContent: 0,
      replies: 0,
      reels: 0,
      targetPosts: 2,
      targetRetweetsWithContent: 0,
      targetReplies: 5,
      targetReels: 1,
      isAutoReset: true,
      submittedAt: null,
      qcStatus: "rejected_with_deduction",
      qcDecisionAmount: 120,
    },
  ];

  for (const row of growthRows) {
    if (!row.accountId) continue;

    await pool.query(
      `INSERT INTO temp_growth (
         user_id,
         social_media_account_id,
         submission_date,
         followers,
         posts,
         retweets_with_content,
         replies,
         reels,
         target_followers,
         target_posts,
         target_retweets_with_content,
         target_replies,
         target_reels,
         is_auto_reset,
         submitted_at,
         qc_status,
         qc_decision_amount
       ) VALUES (
         $1, $2, $3::date, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, $13, $14, $15, $16
       )
       ON CONFLICT (social_media_account_id, submission_date) DO UPDATE SET
         followers = EXCLUDED.followers,
         posts = EXCLUDED.posts,
         retweets_with_content = EXCLUDED.retweets_with_content,
         replies = EXCLUDED.replies,
         reels = EXCLUDED.reels,
         target_posts = EXCLUDED.target_posts,
         target_retweets_with_content = EXCLUDED.target_retweets_with_content,
         target_replies = EXCLUDED.target_replies,
         target_reels = EXCLUDED.target_reels,
         is_auto_reset = EXCLUDED.is_auto_reset,
         submitted_at = EXCLUDED.submitted_at,
         qc_status = EXCLUDED.qc_status,
         qc_decision_amount = EXCLUDED.qc_decision_amount`,
      [
        employee.id,
        row.accountId,
        todayCairoDate,
        row.followers,
        row.posts,
        row.retweetsWithContent,
        row.replies,
        row.reels,
        row.targetPosts,
        row.targetRetweetsWithContent,
        row.targetReplies,
        row.targetReels,
        row.isAutoReset,
        row.submittedAt,
        row.qcStatus,
        row.qcDecisionAmount,
      ]
    );
  }

  console.log(
    "Seeded users and dashboard sample data: admin@temp.local, lead@temp.local, employee@temp.local — password: admin123"
  );

  await pool.end();
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });

