import path from "node:path";
import process from "node:process";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForDatabase() {
  const maxAttempts = 30;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `⏳ Waiting for database (${attempt}/${maxAttempts}): ${message}`,
      );
      await wait(1000);
    }
  }
  throw new Error("Database did not become ready in time.");
}

async function run() {
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");
  await waitForDatabase();
  await migrate(db, { migrationsFolder });
}

run()
  .then(async () => {
    console.log("✅ Database migrations applied successfully");
    await pool.end();
  })
  .catch(async (error) => {
    console.error("❌ Failed to run migrations");
    console.error(error);
    await pool.end();
    process.exit(1);
  });
