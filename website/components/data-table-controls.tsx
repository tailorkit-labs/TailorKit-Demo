"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardFrameFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { TableHead } from "@/components/ui/table";

export function useTableSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const count = ids.filter((id) => selected.has(id)).length;
  function toggle(id: string, checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function togglePage(pageIds: string[], checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      pageIds.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }
  return { selected, count, toggle, togglePage };
}

export function PageSelection({
  ids,
  selected,
  onChange,
}: {
  ids: string[];
  selected: Set<string>;
  onChange: (checked: boolean) => void;
}) {
  const count = ids.filter((id) => selected.has(id)).length;
  return (
    <Checkbox
      aria-label="Select all rows on this page"
      disabled={!ids.length}
      checked={ids.length > 0 && count === ids.length}
      indeterminate={count > 0 && count < ids.length}
      onCheckedChange={onChange}
    />
  );
}

export function SortableTableHead({
  children,
  direction,
  onSort,
  className,
  style,
}: {
  children: string;
  direction?: "asc" | "desc";
  onSort: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = direction === "desc" ? ChevronDownIcon : ChevronUpIcon;
  return (
    <TableHead
      className={className}
      style={style}
      aria-sort={direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}
    >
      <button
        type="button"
        onClick={onSort}
        aria-label={"Sort by " + children.toLowerCase()}
        className="flex h-full w-full cursor-pointer items-center justify-between gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
        {direction ? <Icon aria-hidden="true" className="size-4 shrink-0 opacity-80" /> : null}
      </button>
    </TableHead>
  );
}

const statusColors: Record<string, string> = {
  lead: "bg-muted-foreground",
  active: "bg-info",
  customer: "bg-success",
  qualified: "bg-info",
  proposal: "bg-warning",
  negotiation: "bg-info",
  won: "bg-success",
  lost: "bg-destructive",
};
export function TableStatus({ status }: { status: string }) {
  return (
    <Badge variant="outline">
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", statusColors[status] ?? "bg-muted-foreground")}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export function DataTablePagination({
  total,
  page,
  pageSize = 10,
  onPageChange,
  label,
  selected = 0,
}: {
  total: number;
  page: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  label: string;
  selected?: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = Array.from({ length: pageCount }, (_, i) => ({
    value: i + 1,
    label: total ? `${i * pageSize + 1}–${Math.min((i + 1) * pageSize, total)}` : "0–0",
  }));
  return (
    <CardFrameFooter className="p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 whitespace-nowrap text-sm">
          <span className="text-muted-foreground">Viewing</span>
          <Select
            items={items}
            value={page}
            onValueChange={(value) => {
              if (value !== null) onPageChange(value);
            }}
            disabled={total === 0}
          >
            <SelectTrigger size="sm" className="w-fit min-w-0" aria-label={label + " result range"}>
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectGroup>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectPopup>
          </Select>
          <span className="text-muted-foreground">
            of <strong className="font-medium text-foreground">{total}</strong> results
          </span>
        </div>
        {selected > 0 ? (
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {selected} selected
          </span>
        ) : null}
        <Pagination aria-label={label + " pagination"} className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className="sm:*:[svg]:hidden"
                render={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                  />
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                className="sm:*:[svg]:hidden"
                render={
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === pageCount}
                    onClick={() => onPageChange(page + 1)}
                  />
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </CardFrameFooter>
  );
}
