import assert from "node:assert/strict";
import { test } from "node:test";
import { companyHref, getCompanies } from "../lib/companies";
import type { Contact, Deal, Workspace } from "../lib/workspace";

function contact(id: string, company: string, status: Contact["status"] = "lead"): Contact {
  return {
    id,
    company,
    status,
    tenantId: "tenant",
    name: "Contact " + id,
    email: id + "@example.com",
    role: "Founder",
    createdAt: "2026-01-01T12:00:00.000Z",
  };
}
function deal(id: string, contactId: string | null, stage: Deal["stage"], value: number): Deal {
  return {
    id,
    contactId,
    stage,
    value,
    tenantId: "tenant",
    title: id,
    position: 0,
    createdAt: "2026-01-01T12:00:00.000Z",
    closeDate: "2026-02-01T12:00:00.000Z",
  };
}
function workspace(contacts: Contact[], deals: Deal[] = []): Workspace {
  return {
    tenant: { id: "tenant", name: "Demo", setupVersion: 1 },
    contacts,
    deals,
    tasks: [],
    activities: [],
  };
}

void test("groups case and whitespace variants while keeping different companies separate", () => {
  const input = workspace([
    contact("a", " Layers "),
    contact("b", "layers", "active"),
    contact("c", "Other"),
    contact("d", " "),
  ]);
  const companies = getCompanies(input);
  assert.equal(companies.length, 2);
  assert.equal(companies[0].name, "Layers");
  assert.deepEqual(
    companies[0].contacts.map((item) => item.id),
    ["a", "b"],
  );
  assert.equal(companies[0].status, "active");
  assert.equal(input.contacts[0].company, " Layers ");
});

void test("uses the oldest contact for display name and date, and customer status takes precedence", () => {
  const first = { ...contact("a", "Layers", "customer"), createdAt: "2025-01-01T12:00:00.000Z" };
  const companies = getCompanies(workspace([contact("b", "LAYERS", "active"), first]));
  assert.equal(companies[0].name, "Layers");
  assert.equal(companies[0].createdAt, first.createdAt);
  assert.equal(companies[0].status, "customer");
});

void test("aggregates deals for every company contact and excludes won/lost from open pipeline", () => {
  const companies = getCompanies(
    workspace(
      [contact("a", "Layers"), contact("b", "Layers"), contact("c", "Other")],
      [
        deal("qualified", "a", "qualified", 100),
        deal("proposal", "b", "proposal", 200),
        deal("negotiation", "b", "negotiation", 300),
        deal("won", "a", "won", 400),
        deal("lost", "b", "lost", 500),
        deal("other", "c", "qualified", 600),
        deal("unassigned", null, "qualified", 700),
      ],
    ),
  );
  assert.equal(companies[0].pipeline, 600);
  assert.equal(companies[0].won, 400);
  assert.equal(companies[0].deals.length, 5);
});

void test("includes only related follow-ups and activity and deduplicates contact email domains", () => {
  const input = workspace([contact("a", "Layers"), contact("b", "Layers"), contact("c", "Other")]);
  input.tasks = ["a", "b", "c", null].map((contactId, index) => ({
    id: String(index),
    tenantId: "tenant",
    contactId,
    title: "Follow up",
    completed: false,
    createdAt: "2026-01-01T12:00:00.000Z",
    dueDate: "2026-02-01T12:00:00.000Z",
  }));
  input.activities = ["a", "b", "c", null].map((contactId, index) => ({
    id: String(index),
    tenantId: "tenant",
    contactId,
    type: "note",
    title: "Note",
    description: "Context",
    createdAt: "2026-01-01T12:00:00.000Z",
  }));
  const company = getCompanies(input)[0];
  assert.equal(company.tasks.length, 2);
  assert.equal(company.activities.length, 2);
  assert.deepEqual(company.domains, ["example.com"]);
});

void test("company URLs round-trip punctuation and Unicode names without collisions", () => {
  for (const name of ["Command+R", "R&D / Design", "Café #1", "100%", "A-B", "A B"]) {
    const href = companyHref(name);
    assert.equal(decodeURIComponent(href.slice("/companies/".length)), name.toLowerCase());
    assert.equal(href.slice("/companies/".length).includes("/"), false);
  }
  assert.notEqual(companyHref("A-B"), companyHref("A B"));
});

void test("empty workspaces have no companies", () => {
  assert.deepEqual(getCompanies(workspace([])), []);
});
