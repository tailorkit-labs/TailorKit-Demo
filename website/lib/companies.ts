import type { Contact, Workspace } from "./workspace";

export function companyKey(name: string) {
  return name.trim().toLowerCase();
}

export function companyHref(name: string) {
  return "/companies/" + encodeURIComponent(companyKey(name));
}

/** Companies reflect the current contact records in this workspace. */
export function getCompanies(workspace: Workspace) {
  const groups = new Map<string, Contact[]>();
  for (const contact of workspace.contacts) {
    const key = companyKey(contact.company);
    if (!key) continue;
    const contacts = groups.get(key) ?? [];
    contacts.push(contact);
    groups.set(key, contacts);
  }
  return Array.from(groups, ([key, contacts]) => {
    const ordered = [...contacts].sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    const ids = new Set(contacts.map((contact) => contact.id));
    const deals = workspace.deals.filter((deal) => deal.contactId && ids.has(deal.contactId));
    const tasks = workspace.tasks.filter((task) => task.contactId && ids.has(task.contactId));
    const activities = workspace.activities.filter(
      (activity) => activity.contactId && ids.has(activity.contactId),
    );
    const status: Contact["status"] = contacts.some((contact) => contact.status === "customer")
      ? "customer"
      : contacts.some((contact) => contact.status === "active")
        ? "active"
        : "lead";
    return {
      key,
      name: ordered[0].company.trim(),
      createdAt: ordered[0].createdAt,
      status,
      contacts: [...contacts].sort((a, b) => a.name.localeCompare(b.name)),
      domains: [...new Set(contacts.map((contact) => contact.email.split("@")[1]))]
        .filter((domain): domain is string => !!domain)
        .sort(),
      deals,
      tasks,
      activities,
      pipeline: deals
        .filter((deal) => deal.stage !== "won" && deal.stage !== "lost")
        .reduce((sum, deal) => sum + deal.value, 0),
      won: deals.filter((deal) => deal.stage === "won").reduce((sum, deal) => sum + deal.value, 0),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export type Company = ReturnType<typeof getCompanies>[number];
