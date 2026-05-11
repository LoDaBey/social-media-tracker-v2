import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const { pool, queryOne } = await import("../lib/db");
  const { createNotification } = await import("../lib/notifications");

  const employee = await queryOne<{ id: number }>(
    "SELECT id FROM temp_users WHERE email = $1",
    ["employee@temp.local"]
  );
  if (!employee) {
    console.warn("No employee@temp.local user; skip seed-notifications.");
    await pool.end();
    return;
  }

  const existing = await pool.query(
    `SELECT 1 FROM temp_notifications WHERE user_id = $1 LIMIT 1`,
    [employee.id]
  );
  if ((existing.rowCount ?? 0) > 0) {
    console.log("Notifications already exist for seeded employee; skip.");
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await createNotification(client, {
      user_id: employee.id,
      type: "submission_approved",
      category: "qc",
      title: "Your submission was approved",
      body: "@sample · 1 Jan · Mariam (Team Lead) approved your numbers.",
      action_route: "/dashboard",
      metadata: { growth_id: 0 },
      created_by: null,
    });

    await createNotification(client, {
      user_id: employee.id,
      type: "bonus_received",
      category: "wallet",
      title: "Bonus received",
      body: "+500 EGP · Spot bonus. See it in your wallet.",
      action_route: "/wallet",
      metadata: { amount: 500 },
      created_by: null,
    });

    await createNotification(client, {
      user_id: employee.id,
      type: "payout_processed",
      category: "wallet",
      title: "Payout for last cycle processed",
      body: "4,200 EGP for cycle ending 10 Apr has been processed. A new cycle started today.",
      action_route: "/wallet?tab=history",
      metadata: {},
      created_by: null,
    });

    await createNotification(client, {
      user_id: employee.id,
      type: "level_changed",
      category: "admin",
      title: "Your level was updated",
      body: "You are now Level 4 (V. Good). Your salary adjustment is +2%.",
      action_route: "/dashboard",
      metadata: { old_level: 3, new_level: 4 },
      created_by: null,
    });

    await createNotification(client, {
      user_id: employee.id,
      type: "targets_changed",
      category: "admin",
      title: "Account targets updated",
      body: "Your assigned accounts changed. Visit setup to add or archive accounts.",
      action_route: "/setup",
      metadata: {},
      created_by: null,
    });

    await client.query("COMMIT");
    console.log("Inserted sample notifications for employee@temp.local");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
