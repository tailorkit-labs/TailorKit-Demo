"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  InboxIcon,
  MailIcon,
  MailOpenIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  UserRoundIcon,
} from "lucide-react";
import type { Workspace } from "@/lib/workspace";
import { inboxSchema, seedInbox, type InboxThread } from "@/lib/inbox-demo";
import { cn } from "@/lib/utils";
import { AppPageHeading } from "@/components/app/app-page-header";
import { ContactAvatar } from "@/components/contact-avatar";
import { RecordDialog } from "@/components/record-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { toastManager } from "@/components/ui/toast";

const time = (date: string) =>
  new Date(date).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
    timeZone: "Australia/Melbourne",
  });
const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
function InboxEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function InboxPage({ workspace, now }: { workspace: Workspace; now: string }) {
  const [threads, setThreads] = useState<InboxThread[]>(() => seedInbox(workspace.contacts, now));
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [details, setDetails] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const storageKey = "forma-inbox-v1:" + workspace.tenant.id;
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const result = inboxSchema.safeParse(JSON.parse(saved));
        if (result.success) setThreads(result.data);
      }
    } catch {
      /* Storage may be unavailable; the demo still works in memory. */
    }
    setReady(true);
  }, [storageKey]);
  const contacts = new Map(workspace.contacts.map((contact) => [contact.id, contact]));
  const validThreads = threads.filter((thread) => contacts.has(thread.contactId));
  const unreadCount = validThreads.filter((thread) => thread.unread && !thread.archived).length;
  const filtered = validThreads
    .filter((thread) => {
      if (filter === "archived" ? !thread.archived : thread.archived) return false;
      if (filter === "unread" && !thread.unread) return false;
      const contact = contacts.get(thread.contactId)!;
      return [
        contact.name,
        contact.company,
        thread.subject,
        ...thread.messages.map((message) => message.body),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase().trim());
    })
    .sort((a, b) => b.messages.at(-1)!.sentAt.localeCompare(a.messages.at(-1)!.sentAt));
  // Keep an opened unread conversation visible after reading it.
  const opened = selectedId ? validThreads.find((thread) => thread.id === selectedId) : undefined;
  const selected = opened ?? filtered[0];
  const contact = selected ? contacts.get(selected.contactId) : undefined;
  const relatedDeals = contact
    ? workspace.deals.filter((deal) => deal.contactId === contact.id)
    : [];
  function save(next: InboxThread[]) {
    setThreads(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      toastManager.add({
        type: "error",
        title: "Browser storage is unavailable",
        description: "Your changes will last until you leave this page.",
      });
    }
  }
  function updateThread(id: string, values: Partial<Pick<InboxThread, "unread" | "archived">>) {
    save(threads.map((thread) => (thread.id === id ? { ...thread, ...values } : thread)));
  }
  function openThread(thread: InboxThread) {
    setSelectedId(thread.id);
    setDetails(false);
    if (thread.unread) updateThread(thread.id, { unread: false });
  }
  function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const body = drafts[selected.id]?.trim();
    if (!body) return;
    if (selected.messages.length >= 100) {
      toastManager.add({ type: "error", title: "This demo conversation is full" });
      return;
    }
    save(
      threads.map((thread) =>
        thread.id === selected.id
          ? {
              ...thread,
              unread: false,
              messages: [
                ...thread.messages,
                {
                  id: crypto.randomUUID(),
                  direction: "outgoing",
                  body,
                  sentAt: new Date().toISOString(),
                },
              ],
            }
          : thread,
      ),
    );
    setDrafts((current) => ({ ...current, [selected.id]: "" }));
    toastManager.add({ type: "success", title: "Demo reply saved" });
  }
  function compose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => {
      const entry = data.get(name);
      return typeof entry === "string" ? entry.trim() : "";
    };
    const contactId = value("contactId");
    const subject = value("subject");
    const body = value("body");
    if (!contacts.has(contactId) || !subject || !body) return;
    const thread: InboxThread = {
      id: crypto.randomUUID(),
      contactId,
      subject,
      unread: false,
      archived: false,
      messages: [
        { id: crypto.randomUUID(), direction: "outgoing", body, sentAt: new Date().toISOString() },
      ],
    };
    save([thread, ...threads]);
    setFilter("all");
    setSearch("");
    setSelectedId(thread.id);
    setComposeOpen(false);
    toastManager.add({ type: "success", title: "Demo message saved" });
  }
  return (
    <>
      <AppPageHeading>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">Inbox</h1>
            <Badge variant="secondary">{unreadCount} unread</Badge>
          </div>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger
              render={
                <Button disabled={!ready || !workspace.contacts.length || threads.length >= 100} />
              }
            >
              <PlusIcon data-icon="inline-start" />
              New message
            </DialogTrigger>
            <DialogPopup>
              <DialogHeader>
                <DialogTitle>New message</DialogTitle>
                <DialogDescription>
                  Create a demo conversation with one of your contacts. Messages stay in this
                  browser.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={compose}>
                <DialogPanel>
                  <Fieldset className="flex flex-col gap-6">
                    <FieldsetLegend className="sr-only">Message details</FieldsetLegend>
                    <Field>
                      <FieldLabel htmlFor="inbox-recipient">To</FieldLabel>
                      <Select
                        name="contactId"
                        defaultValue={workspace.contacts[0]?.id}
                        items={workspace.contacts.map((item) => ({
                          value: item.id,
                          label: item.name,
                        }))}
                      >
                        <SelectTrigger id="inbox-recipient" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          <SelectGroup>
                            {workspace.contacts.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectPopup>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="inbox-subject">Subject</FieldLabel>
                      <Input
                        id="inbox-subject"
                        name="subject"
                        required
                        maxLength={160}
                        placeholder="What would you like to discuss?"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="inbox-message">Message</FieldLabel>
                      <Textarea
                        id="inbox-message"
                        name="body"
                        required
                        maxLength={5000}
                        rows={6}
                        placeholder="Write your message…"
                      />
                    </Field>
                  </Fieldset>
                </DialogPanel>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <SendIcon data-icon="inline-start" />
                    Save demo message
                  </Button>
                </DialogFooter>
              </form>
            </DialogPopup>
          </Dialog>
        </div>
      </AppPageHeading>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>Every conversation, in one place.</p>
        <span className="flex items-center gap-2">
          <Badge variant="outline">Demo inbox</Badge>Sample emails · replies saved in this browser
        </span>
      </div>
      <div className="grid h-[calc(100dvh-18rem)] min-h-[360px] md:h-[calc(100dvh-11rem)] md:min-h-[400px] min-w-0 overflow-hidden rounded-xl border bg-background md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_220px]">
        <section
          aria-label="Conversations"
          className={cn(
            "flex min-h-0 min-w-0 flex-col md:border-r",
            selectedId !== null && "max-md:hidden",
          )}
        >
          <div className="flex flex-col gap-4 border-b p-4">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search conversations"
                placeholder="Search conversations…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedId(null);
                }}
              />
            </InputGroup>
            <ToggleGroup
              multiple={false}
              variant="outline"
              size="sm"
              value={[filter]}
              aria-label="Inbox filter"
              onValueChange={(value) => {
                setFilter(value[0] ?? "all");
                setSelectedId(null);
              }}
            >
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="unread">Unread</ToggleGroupItem>
              <ToggleGroupItem value="archived">Archived</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <ScrollArea className="flex-1" overscrollContain>
            {filtered.map((thread) => {
              const person = contacts.get(thread.contactId)!;
              const last = thread.messages.at(-1)!;
              return (
                <button
                  key={thread.id}
                  type="button"
                  disabled={!ready}
                  aria-label={`${person.name}: ${thread.subject}${thread.unread ? ", unread" : ""}`}
                  aria-pressed={selected?.id === thread.id}
                  onClick={() => openThread(thread)}
                  className={cn(
                    "flex w-full min-w-0 gap-3 border-b p-4 text-left transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
                    selected?.id === thread.id && "bg-accent",
                  )}
                >
                  <ContactAvatar contact={person} className="size-9 shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{person.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {time(last.sentAt)}
                      </span>
                    </div>
                    <span className={cn("truncate text-xs", thread.unread && "font-semibold")}>
                      {thread.subject}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {last.direction === "outgoing" ? "You: " : ""}
                      {last.body}
                    </span>
                    <span className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      {person.company}
                      {thread.unread ? (
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                      ) : null}
                    </span>
                  </div>
                </button>
              );
            })}
            {!filtered.length ? (
              <InboxEmpty
                title={filter === "unread" && !search ? "All caught up" : "No conversations"}
                description={
                  search
                    ? "Try another name, company, or keyword."
                    : filter === "archived"
                      ? "Archived conversations will appear here."
                      : "Start a conversation with one of your contacts."
                }
              />
            ) : null}
          </ScrollArea>
        </section>
        <section
          aria-label="Message thread"
          className={cn("flex min-h-0 min-w-0 flex-col", selectedId === null && "max-md:hidden")}
        >
          {selected && contact ? (
            <>
              <div className="flex flex-col gap-3 border-b p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="md:hidden"
                    aria-label="Back to conversations"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeftIcon />
                  </Button>
                  <ContactAvatar contact={contact} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{contact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!ready}
                    aria-label={selected.unread ? "Mark as read" : "Mark as unread"}
                    onClick={() => updateThread(selected.id, { unread: !selected.unread })}
                  >
                    {selected.unread ? <MailOpenIcon /> : <MailIcon />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!ready}
                    aria-label={selected.archived ? "Restore conversation" : "Archive conversation"}
                    onClick={() => {
                      updateThread(selected.id, { archived: !selected.archived });
                      setSelectedId(null);
                    }}
                  >
                    {selected.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="xl:hidden"
                    aria-label="Toggle contact details"
                    aria-expanded={details}
                    onClick={() => setDetails(!details)}
                  >
                    <UserRoundIcon />
                  </Button>
                </div>
                <h2 className="text-base font-semibold">{selected.subject}</h2>
              </div>
              <ScrollArea key={selected.id} className="flex-1" overscrollContain>
                <div className="flex flex-col gap-6 p-4 sm:p-6">
                  {details ? (
                    <div className="flex flex-col gap-2 rounded-lg border p-4 xl:hidden">
                      <p className="text-sm font-medium">
                        {contact.company} · {contact.role}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                      <Link className="text-sm underline" href={`/contacts/${contact.id}`}>
                        View contact
                      </Link>
                      <RecordDialog
                        kind="task"
                        workspace={workspace}
                        defaultContactId={contact.id}
                        triggerLabel="Add follow-up"
                      />
                    </div>
                  ) : null}
                  {selected.messages.map((message) => (
                    <article key={message.id} className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={message.direction === "incoming" ? "secondary" : "outline"}
                          >
                            {message.direction === "incoming" ? contact.name : "You"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {message.direction === "incoming"
                              ? "to you"
                              : `to ${contact.name.split(" ")[0]}`}
                          </span>
                        </div>
                        <time
                          dateTime={message.sentAt}
                          className="text-[10px] text-muted-foreground"
                        >
                          {time(message.sentAt)}
                        </time>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.body}
                      </p>
                      <Separator />
                    </article>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={reply} className="flex shrink-0 flex-col gap-3 border-t p-4">
                <Field>
                  <FieldLabel htmlFor="inbox-reply" className="sr-only">
                    Reply to {contact.name}
                  </FieldLabel>
                  <Textarea
                    id="inbox-reply"
                    value={drafts[selected.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [selected.id]: event.target.value }))
                    }
                    placeholder={`Reply to ${contact.name.split(" ")[0]}…`}
                    maxLength={5000}
                    rows={3}
                    disabled={!ready || selected.archived}
                  />
                </Field>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-muted-foreground">
                    {selected.archived
                      ? "Restore this conversation to reply."
                      : "Demo replies are saved here. No email is sent."}
                  </p>
                  <Button
                    size="sm"
                    type="submit"
                    disabled={!ready || selected.archived || !drafts[selected.id]?.trim()}
                  >
                    <SendIcon data-icon="inline-start" />
                    Save demo reply
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <InboxEmpty
                title="Your next conversation starts here"
                description="Choose a conversation or create a new message."
              />
            </div>
          )}
        </section>
        <aside aria-label="Contact details" className="hidden min-h-0 min-w-0 border-l xl:block">
          <ScrollArea overscrollContain>
            {contact ? (
              <div className="flex flex-col gap-6 p-5">
                <div className="flex flex-col items-center gap-2 text-center">
                  <ContactAvatar contact={contact} className="size-16" />
                  <h3 className="text-sm font-semibold">{contact.name}</h3>
                  <p className="text-xs text-muted-foreground">{contact.role}</p>
                  <Badge variant="secondary">{contact.status}</Badge>
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium">Contact details</p>
                  <p className="break-words text-sm">{contact.company}</p>
                  <p className="break-all text-xs text-muted-foreground">{contact.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/contacts/${contact.id}`} />}
                  >
                    <ArrowUpRightIcon data-icon="inline-start" />
                    View contact
                  </Button>
                  <RecordDialog
                    kind="task"
                    workspace={workspace}
                    defaultContactId={contact.id}
                    triggerLabel="Add follow-up"
                  />
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium">Related opportunities</p>
                  {relatedDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href="/pipeline"
                      className="flex flex-col gap-1 rounded-lg border p-3 hover:bg-accent"
                    >
                      <span className="text-xs font-medium">{deal.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {money(deal.value)} · {deal.stage}
                      </span>
                    </Link>
                  ))}
                  {!relatedDeals.length ? (
                    <p className="text-xs text-muted-foreground">No linked opportunities yet.</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <InboxEmpty
                title="Contact details"
                description="Select a conversation to see its contact."
              />
            )}
          </ScrollArea>
        </aside>
      </div>
    </>
  );
}
