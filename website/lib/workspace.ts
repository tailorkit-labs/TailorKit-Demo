import { cache } from "react";
import { headers } from "next/headers";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./drizzle";
import { activities, contacts, deals, tasks, tenants } from "./schema";

import { CURRENT_SETUP_VERSION } from "./provision";
export const SETUP_VERSION = CURRENT_SETUP_VERSION;
export { RECORD_LIMIT } from "./mutation-guards";
export type Contact = Omit<typeof contacts.$inferSelect, "createdAt"> & { createdAt: string };
export type Deal = Omit<typeof deals.$inferSelect, "createdAt" | "closeDate"> & {
  createdAt: string;
  closeDate: string;
};
export type Task = Omit<typeof tasks.$inferSelect, "createdAt" | "dueDate"> & {
  createdAt: string;
  dueDate: string;
};
export type Activity = Omit<typeof activities.$inferSelect, "createdAt"> & { createdAt: string };
export type Workspace = {
  tenant: { id: string; name: string; setupVersion: number };
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
};
export const getCurrentSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
export async function requireTenant() {
  const session = await getCurrentSession();
  if (!session) throw new Error("Your session expired. Refresh to create a demo workspace.");
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(and(eq(tenants.userId, session.user.id), gte(tenants.setupVersion, SETUP_VERSION)));
  if (!tenant) throw new Error("Workspace setup is not complete.");
  return tenant;
}
export const getWorkspace = cache(async (): Promise<Workspace | null> => {
  const session = await getCurrentSession();
  if (!session) return null;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.userId, session.user.id));
  if (!tenant || tenant.setupVersion < SETUP_VERSION) return null;
  const [contactRows, dealRows, taskRows, activityRows] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(eq(contacts.tenantId, tenant.id))
      .orderBy(desc(contacts.createdAt)),
    db
      .select()
      .from(deals)
      .where(eq(deals.tenantId, tenant.id))
      .orderBy(asc(deals.position), desc(deals.createdAt), asc(deals.id)),
    db.select().from(tasks).where(eq(tasks.tenantId, tenant.id)).orderBy(tasks.dueDate),
    db
      .select()
      .from(activities)
      .where(eq(activities.tenantId, tenant.id))
      .orderBy(desc(activities.createdAt))
      .limit(50),
  ]);
  return {
    tenant: { id: tenant.id, name: tenant.name, setupVersion: tenant.setupVersion },
    contacts: contactRows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    deals: dealRows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      closeDate: r.closeDate.toISOString(),
    })),
    tasks: taskRows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      dueDate: r.dueDate.toISOString(),
    })),
    activities: activityRows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
});
