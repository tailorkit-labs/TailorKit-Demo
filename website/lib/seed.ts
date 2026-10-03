import { db } from "./drizzle";
import { activities, contacts, deals, tasks } from "./schema";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
const people = [
  ["Olivia Rhye", "olivia", "Layers", "Head of Design"],
  ["Phoenix Baker", "phoenix", "Sisyphus", "Founder"],
  ["Lana Steiner", "lana", "Catalog", "Product Director"],
  ["Demi Wilkinson", "demi", "Circooles", "CEO"],
  ["Drew Cano", "drew", "Hourglass", "VP of Marketing"],
  ["Natali Craig", "natali", "Command+R", "Head of Operations"],
  ["Orlando Diggs", "orlando", "Quotient", "Co-founder"],
  ["Andi Lane", "andi", "Sisyphus", "Design Lead"],
  ["Kate Morrison", "kate", "Goodwell", "CMO"],
  ["Koray Okumus", "koray", "Orbit", "Founder"],
  ["Ava Thompson", "ava", "Northstar", "Product Lead"],
  ["Noah Wilson", "noah", "Luminary", "CTO"],
  ["Mia Chen", "mia", "Vertex", "Head of Growth"],
  ["Ethan Williams", "ethan", "Greenhouse", "CEO"],
  ["Sofia Garcia", "sofia", "Forma", "Creative Director"],
  ["James Brown", "james", "Amplitude", "VP of Sales"],
  ["Isabella Rossi", "isabella", "Aperture", "Founder"],
  ["Lucas Martin", "lucas", "Kinfolk", "Operations Lead"],
  ["Charlotte Lee", "charlotte", "Baseline", "Design Director"],
  ["Oliver Davis", "oliver", "Meridian", "CEO"],
  ["Amelia Walker", "amelia", "Linear Labs", "Product Manager"],
  ["Henry Clark", "henry", "Horizon", "CTO"],
  ["Harper Lewis", "harper", "Copper", "Head of Sales"],
  ["Jack Robinson", "jack", "Clover", "Founder"],
  ["Evelyn Hall", "evelyn", "Dovetail", "Marketing Director"],
  ["Leo Young", "leo", "Fieldwork", "Co-founder"],
  ["Aria King", "aria", "Fable", "VP of Product"],
  ["Benjamin Wright", "benjamin", "Altitude", "Head of People"],
  ["Ella Scott", "ella", "Goodwell", "Design Lead"],
  ["William Green", "william", "Layers", "Engineering Lead"],
];
function day(offset: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}
export async function seedWorkspace(tx: Transaction, tenantId: string) {
  const rows = people.map(([name, email, company, role], i) => ({
    id: crypto.randomUUID(),
    tenantId,
    name,
    email: `${email}@${company.toLowerCase().replace(/[^a-z]/g, "")}.example`,
    company,
    role,
    status: (["customer", "active", "lead"] as const)[i % 3],
    createdAt: day(-65 + i * 2),
  }));
  await tx.insert(contacts).values(rows);
  const dealTitles = [
    "Brand & website refresh",
    "Enterprise annual plan",
    "Product design partnership",
    "Growth platform rollout",
    "Team workspace expansion",
    "Customer experience sprint",
  ];
  await tx.insert(deals).values(
    rows.slice(0, 18).map((contact, i) => ({
      id: crypto.randomUUID(),
      tenantId,
      contactId: contact.id,
      title: `${contact.company} · ${dealTitles[i % dealTitles.length]}`,
      value: [12000, 24500, 18000, 36000, 8500, 42000, 15500, 28000, 19500][i % 9],
      stage: (["qualified", "proposal", "negotiation", "won", "won", "lost"] as const)[i % 6],
      closeDate: day(i % 6 === 3 || i % 6 === 4 ? -45 + i * 2 : 7 + i * 2),
      createdAt: day(-60 + i * 2),
    })),
  );
  const taskTitles = [
    "Follow up on proposal",
    "Prepare discovery call",
    "Send project timeline",
    "Review contract with team",
    "Share onboarding guide",
    "Schedule quarterly check-in",
  ];
  await tx.insert(tasks).values(
    rows.slice(0, 12).map((contact, i) => ({
      id: crypto.randomUUID(),
      tenantId,
      contactId: contact.id,
      title: `${taskTitles[i % 6]} · ${contact.company}`,
      dueDate: day(i - 2),
      completed: i >= 9,
      createdAt: day(-8),
    })),
  );
  await tx.insert(activities).values(
    rows.slice(0, 12).map((contact, i) => ({
      id: crypto.randomUUID(),
      tenantId,
      contactId: contact.id,
      type: (["note", "deal", "contact"] as const)[i % 3],
      title: ["Discovery call completed", "Proposal sent", "Contact added"][i % 3],
      description: [
        `Spoke with ${contact.name} about their goals. Follow up with a tailored plan.`,
        `Shared the initial proposal with ${contact.company}.`,
        `${contact.name} joined the workspace from ${contact.company}.`,
      ][i % 3],
      createdAt: new Date(Date.now() - i * 1000 * 60 * 90),
    })),
  );
}
