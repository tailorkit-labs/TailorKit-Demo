import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
// Deployments use credentials injected by Neon; local development uses Docker.
if (!process.env.VERCEL) {
  config({ path: ".env.local" });
  config();
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (process.env.VERCEL && !url) {
  throw new Error("Connect Neon to this Vercel environment before building.");
}
export default defineConfig({
  schema: "./lib/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: url || "postgresql://crm:crm@localhost:5432/crm" },
});
