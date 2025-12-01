import { config as loadEnv } from "dotenv";
import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  loadEnv({ path: path.resolve(__dirname, `../../${file}`), override: true });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be provided to connect to Postgres.");
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool);
