import path from "node:path";
import process from "node:process";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

async function run() {
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");
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
