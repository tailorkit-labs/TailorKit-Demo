"use client";

import { useState } from "react";
import Link from "next/link";
import type { Workspace } from "@/lib/workspace";
import { RecordDialog } from "@/components/record-dialog";
import { Badge } from "@/components/ui/badge";
import { CardFrame } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DataTablePagination,
  PageSelection,
  SortableTableHead,
  TableStatus,
  useTableSelection,
} from "@/components/data-table-controls";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
export function DashboardTable({ workspace }: { workspace: Workspace }) {
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"title" | "date" | "value">("date");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  function changeSort(column: typeof sort) {
    setDirection(column === sort && direction === "asc" ? "desc" : "asc");
    setSort(column);
    setPage(1);
  }
  const filtered = workspace.deals.filter(
    (deal) =>
      tab === "all" ||
      (tab === "open" ? deal.stage !== "won" && deal.stage !== "lost" : deal.stage === tab),
  );
  const rows = [...filtered].sort((a, b) => {
    const result =
      sort === "date"
        ? a.closeDate.localeCompare(b.closeDate)
        : sort === "title"
          ? a.title.localeCompare(b.title)
          : a.value - b.value;
    return direction === "asc" ? result : -result;
  });
  const selection = useTableSelection(filtered.map((deal) => deal.id));
  const pageCount = Math.max(1, Math.ceil(rows.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const pageIds = visibleRows.map((deal) => deal.id);
  function changeTab(value: string) {
    setTab(value);
    setPage(1);
  }
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => changeTab(String(value))}
      className="flex w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="hidden sm:inline-flex">
          <TabsTrigger value="all">
            All opportunities<Badge variant="secondary">{workspace.deals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="open">Open pipeline</TabsTrigger>
          <TabsTrigger value="won">Won deals</TabsTrigger>
          <TabsTrigger value="lost">Lost deals</TabsTrigger>
        </TabsList>
        <Select
          value={tab}
          onValueChange={(value) => {
            if (value !== null) changeTab(value);
          }}
          items={[
            { value: "all", label: "All opportunities" },
            { value: "open", label: "Open pipeline" },
            { value: "won", label: "Won deals" },
            { value: "lost", label: "Lost deals" },
          ]}
        >
          <SelectTrigger aria-label="Filter opportunities" className="sm:hidden">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            <SelectGroup>
              <SelectItem value="all">All opportunities</SelectItem>
              <SelectItem value="open">Open pipeline</SelectItem>
              <SelectItem value="won">Won deals</SelectItem>
              <SelectItem value="lost">Lost deals</SelectItem>
            </SelectGroup>
          </SelectPopup>
        </Select>
      </div>
      <TabsContent value={tab} className="flex flex-col gap-4">
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
                  style={{ width: "32%" }}
                  direction={sort === "title" ? direction : undefined}
                  onSort={() => changeSort("title")}
                >
                  Opportunity
                </SortableTableHead>
                <TableHead style={{ width: "20%" }}>Contact</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <SortableTableHead
                  className="w-28"
                  direction={sort === "value" ? direction : undefined}
                  onSort={() => changeSort("value")}
                >
                  Value
                </SortableTableHead>
                <SortableTableHead
                  className="w-28"
                  direction={sort === "date" ? direction : undefined}
                  onSort={() => changeSort("date")}
                >
                  Close date
                </SortableTableHead>
                <TableHead className="w-28">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((deal) => {
                const contact = workspace.contacts.find((item) => item.id === deal.contactId);
                return (
                  <TableRow
                    key={deal.id}
                    data-state={selection.selected.has(deal.id) ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={"Select " + deal.title}
                        checked={selection.selected.has(deal.id)}
                        onCheckedChange={(checked) => selection.toggle(deal.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="block truncate font-medium" title={deal.title}>
                        {deal.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      {contact ? (
                        <Link
                          href={"/contacts/" + contact.id}
                          className="block truncate text-muted-foreground hover:underline"
                        >
                          {contact.name}
                        </Link>
                      ) : (
                        "Unassigned"
                      )}
                    </TableCell>
                    <TableCell>
                      <TableStatus status={deal.stage} />
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">{money(deal.value)}</TableCell>
                    <TableCell>
                      {new Date(deal.closeDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </TableCell>
                    <TableCell>
                      <RecordDialog kind="deal" workspace={workspace} deal={deal} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No opportunities here yet. Choose another tab or create a deal.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
          <DataTablePagination
            total={rows.length}
            page={currentPage}
            onPageChange={setPage}
            label="Opportunity"
            selected={selection.count}
          />
        </CardFrame>
      </TabsContent>
    </Tabs>
  );
}
