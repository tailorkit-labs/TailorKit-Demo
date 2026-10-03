import { eq, sql } from "drizzle-orm";
import { db } from "./drizzle";
import { tenants } from "./schema";
import { seedWorkspace } from "./seed";

export const CURRENT_SETUP_VERSION = 1;
export async function provisionForUser(userId: string) {
  return db.transaction(async (tx) => {
    // A per-account transaction lock makes retries and concurrent browser tabs idempotent.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    let [tenant] = await tx.select().from(tenants).where(eq(tenants.userId, userId));
    if (!tenant)
      [tenant] = await tx
        .insert(tenants)
        .values({ id: crypto.randomUUID(), userId, name: "Acme Studio" })
        .returning();
    if (tenant.setupVersion < 1) await seedWorkspace(tx, tenant.id);
    if (tenant.setupVersion < CURRENT_SETUP_VERSION) {
      [tenant] = await tx
        .update(tenants)
        .set({ setupVersion: CURRENT_SETUP_VERSION })
        .where(eq(tenants.id, tenant.id))
        .returning();
    }
    return tenant;
  });
}
