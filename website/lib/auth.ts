import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { anonymous } from "better-auth/plugins/anonymous";
import { db } from "./drizzle";
import * as schema from "./schema";

export const auth = betterAuth({
  appName: "Forma CRM",
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "local-demo-secret-change-for-production-32"
      : undefined),
  plugins: [anonymous({ generateName: () => "Demo visitor", disableDeleteAnonymousUser: true })],
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: { enabled: true, window: 60, max: 30 },
});
