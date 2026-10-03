"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Building2 } from "lucide-react";
import { companyHref, getCompanies, type Company } from "@/lib/companies";
import type { Workspace } from "@/lib/workspace";
import { ContactLink, DealCard, NoResults, PageHeading, TaskRow } from "@/components/crm-pages";
import { RecordDialog } from "@/components/record-dialog";
import {
  DataTablePagination,
  PageSelection,
  SortableTableHead,
  TableStatus,
  useTableSelection,
} from "@/components/data-table-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFrame,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function CompanyAvatar({ large = false }: { large?: boolean }) {
  return (
    <Avatar className={large ? "size-10" : "size-8"}>
      <AvatarFallback>
        <Building2 className="size-4" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );
}

function CompanyList({ workspace, companies }: { workspace: Workspace; companies: Company[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"name" | "contacts" | "pipeline" | "won">("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const filtered = companies.filter(
    (company) =>
      (status === "all" || company.status === status) &&
      [
        company.name,
        ...company.domains,
        ...company.contacts.flatMap((contact) => [contact.name, contact.email, contact.role]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const sorted = [...filtered].sort((a, b) => {
    const result =
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "contacts"
          ? a.contacts.length - b.contacts.length
          : a[sort] - b[sort];
    return (direction === "asc" ? result : -result) || a.name.localeCompare(b.name);
  });
  const selection = useTableSelection(filtered.map((company) => company.key));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(sorted.length / 10)));
  const visible = sorted.slice((currentPage - 1) * 10, currentPage * 10);
  const pageIds = visible.map((company) => company.key);
  function changeSort(column: typeof sort) {
    setDirection(column === sort && direction === "asc" ? "desc" : "asc");
    setSort(column);
    setPage(1);
  }
  return (
    <>
      <PageHeading title="Companies">
        <RecordDialog kind="contact" workspace={workspace} />
      </PageHeading>
      <p className="text-sm text-muted-foreground">
        Explore the companies behind your relationships. Add or edit a contact to update their
        company.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="max-w-sm"
          aria-label="Search companies"
          placeholder="Search company, contact or email…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <ToggleGroup
          multiple={false}
          value={[status]}
          onValueChange={(value) => {
            setStatus(value[0] ?? "all");
            setPage(1);
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="lead">Leads</ToggleGroupItem>
          <ToggleGroupItem value="active">Active</ToggleGroupItem>
          <ToggleGroupItem value="customer">Customers</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <CardFrame className="w-full">
        <Table variant="card" className="min-w-[880px] table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}>
                <PageSelection
                  ids={pageIds}
                  selected={selection.selected}
                  onChange={(checked) => selection.togglePage(pageIds, checked)}
                />
              </TableHead>
              <SortableTableHead
                style={{ width: "30%" }}
                direction={sort === "name" ? direction : undefined}
                onSort={() => changeSort("name")}
              >
                Company
              </SortableTableHead>
              <SortableTableHead
                className="w-28"
                direction={sort === "contacts" ? direction : undefined}
                onSort={() => changeSort("contacts")}
              >
                Contacts
              </SortableTableHead>
              <TableHead className="w-28">Status</TableHead>
              <SortableTableHead
                className="text-right"
                direction={sort === "pipeline" ? direction : undefined}
                onSort={() => changeSort("pipeline")}
              >
                Open pipeline
              </SortableTableHead>
              <SortableTableHead
                className="text-right"
                direction={sort === "won" ? direction : undefined}
                onSort={() => changeSort("won")}
              >
                Won revenue
              </SortableTableHead>
              <TableHead className="w-12">
                <span className="sr-only">View company</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((company) => (
              <TableRow
                key={company.key}
                className="cursor-pointer"
                data-state={selection.selected.has(company.key) ? "selected" : undefined}
                onClick={(event) => {
                  if (
                    event.defaultPrevented ||
                    (event.target as HTMLElement).closest("a, button, input, [role=checkbox]")
                  )
                    return;
                  router.push(companyHref(company.name));
                }}
              >
                <TableCell>
                  <Checkbox
                    aria-label={"Select " + company.name}
                    checked={selection.selected.has(company.key)}
                    onCheckedChange={(checked) => selection.toggle(company.key, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={companyHref(company.name)}
                    className="flex min-w-0 items-center gap-3 hover:underline"
                  >
                    <CompanyAvatar />
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-medium">{company.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {company.domains.join(", ")}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{company.contacts.length}</TableCell>
                <TableCell>
                  <TableStatus status={company.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{money(company.pipeline)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(company.won)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={companyHref(company.name)} />}
                    aria-label={"View " + company.name}
                  >
                    <ArrowUpRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No companies found. Try a different search or add a contact with a company.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <DataTablePagination
          total={filtered.length}
          page={currentPage}
          onPageChange={setPage}
          label="Company"
          selected={selection.count}
        />
      </CardFrame>
    </>
  );
}

function CompanyDetail({ workspace, company }: { workspace: Workspace; company: Company }) {
  // Limit company actions to contacts from this company; mutations retain tenant checks.
  const companyWorkspace = { ...workspace, contacts: company.contacts };
  return (
    <>
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/companies" />}>
          <ArrowLeft data-icon="inline-start" />
          Companies
        </Button>
      </div>
      <PageHeading title={company.name}>
        <RecordDialog kind="contact" workspace={workspace} defaultCompany={company.name} />
      </PageHeading>
      <div className="grid items-start gap-5 xl:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CompanyAvatar large />
              <CardTitle>{company.name}</CardTitle>
              <CardDescription>Company overview</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <TableStatus status={company.status} />
              </div>
              <p className="text-xs text-muted-foreground">
                Relationship reflects the furthest contact status: customer, active, then lead.
              </p>
              <Separator />
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Contacts</dt>
                  <dd>{company.contacts.length}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">First contact added</dt>
                  <dd>{date(company.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Open pipeline</dt>
                  <dd className="font-medium">{money(company.pipeline)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Won revenue</dt>
                  <dd className="font-medium">{money(company.won)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Contact email domains</dt>
                  <dd className="break-all">{company.domains.join(", ") || "No email domains"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
              <CardDescription>Next steps with this company.</CardDescription>
              <CardAction>
                <RecordDialog
                  kind="task"
                  workspace={companyWorkspace}
                  defaultContactId={company.contacts[0].id}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              {company.tasks.length ? (
                company.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} workspace={companyWorkspace} />
                ))
              ) : (
                <NoResults
                  title="No follow-ups"
                  description="Add a follow-up to plan your next step."
                />
              )}
              <Button variant="ghost" size="sm" render={<Link href="/tasks" />}>
                All workspace follow-ups
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>People you know at {company.name}.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <ContactLink contact={contact} />
                          <a
                            className="text-xs text-muted-foreground hover:underline"
                            href={"mailto:" + contact.email}
                          >
                            {contact.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{contact.role}</TableCell>
                      <TableCell>
                        <TableStatus status={contact.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Opportunities</CardTitle>
              <CardDescription>Every deal connected to this company.</CardDescription>
              <CardAction>
                <RecordDialog
                  kind="deal"
                  workspace={companyWorkspace}
                  defaultContactId={company.contacts[0].id}
                />
              </CardAction>
            </CardHeader>
            <CardContent>
              {company.deals.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {company.deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} workspace={companyWorkspace} />
                  ))}
                </div>
              ) : (
                <NoResults
                  title="No opportunities"
                  description="Create a deal with a contact at this company."
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Activity & notes</CardTitle>
              <CardDescription>
                Recent activity across this company’s contacts. Open a contact to add a note.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {company.activities.length ? (
                <div className="flex flex-col gap-5">
                  {company.activities.map((activity) => (
                    <div key={activity.id} className="flex flex-col gap-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <time
                          dateTime={activity.createdAt}
                          className="text-xs text-muted-foreground"
                        >
                          {date(activity.createdAt)}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <ContactLink
                        contact={company.contacts.find(
                          (contact) => contact.id === activity.contactId,
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <NoResults
                  title="No activity yet"
                  description="Add a note on a company contact to keep context here."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export function CompaniesPage({
  workspace,
  companyName,
}: {
  workspace: Workspace;
  companyName?: string;
}) {
  const companies = getCompanies(workspace);
  if (companyName !== undefined) {
    const company = companies.find((item) => item.key === companyName);
    return company ? (
      <CompanyDetail workspace={workspace} company={company} />
    ) : (
      <NoResults
        title="Company not found"
        description="This company may have changed. Return to Companies to continue."
      />
    );
  }
  return <CompanyList workspace={workspace} companies={companies} />;
}
