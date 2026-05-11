import dotenv from "dotenv";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

dotenv.config({ path: ".env.local" });

async function main() {
  const { pool } = await import("../lib/db");
  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  const entries = await readdir(migrationsDir);

  const migrationFiles = entries
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const sql = await readFile(fullPath, "utf8");
    await pool.query(sql);
    console.log(`Applied ${file}`);
  }

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

