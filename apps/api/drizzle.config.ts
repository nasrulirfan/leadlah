import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
import path from "node:path";

const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  loadEnv({ path: path.resolve(__dirname, file), override: true });
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before running Drizzle commands.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema/index.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: databaseUrl
  }
});
