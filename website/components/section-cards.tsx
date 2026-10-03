"use client";

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { Workspace } from "@/lib/workspace";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
function change(current: number, previous: number) {
  return previous ? ((current - previous) / previous) * 100 : null;
}
function trend(value: number | null) {
  return value === null ? "No prior period" : (value > 0 ? "+" : "") + value.toFixed(1) + "%";
}

// Preserve dashboard-01's card composition and styling; only the contents use CRM data.
export function SectionCards({ workspace }: { workspace: Workspace }) {
  const now = Date.now();
  const cutoff = now - 30 * 86400000;
  const previousCutoff = now - 60 * 86400000;
  const inCurrent = (value: string) =>
    new Date(value).getTime() >= cutoff && new Date(value).getTime() <= now;
  const inPrevious = (value: string) =>
    new Date(value).getTime() >= previousCutoff && new Date(value).getTime() < cutoff;
  const won = workspace.deals.filter((deal) => deal.stage === "won");
  const revenue = (rows: typeof won) => rows.reduce((sum, deal) => sum + deal.value, 0);
  const revenueChange = change(
    revenue(won.filter((deal) => inCurrent(deal.closeDate))),
    revenue(won.filter((deal) => inPrevious(deal.closeDate))),
  );
  const customers = workspace.contacts.filter((contact) => contact.status === "customer");
  const newCustomers = customers.filter((contact) => inCurrent(contact.createdAt)).length;
  const customerChange = change(
    newCustomers,
    customers.filter((contact) => inPrevious(contact.createdAt)).length,
  );
  const active = workspace.contacts.filter((contact) => contact.status !== "lead").length;
  const newContacts = workspace.contacts.filter((contact) => inCurrent(contact.createdAt)).length;
  const growth = change(
    newContacts,
    workspace.contacts.filter((contact) => inPrevious(contact.createdAt)).length,
  );
  const metrics = [
    {
      title: "Total Revenue",
      value: currency(revenue(won)),
      badge: trend(revenueChange),
      detail: won.length + " successful deals",
      description: "Vs. previous 30 days",
      down: revenueChange !== null && revenueChange < 0,
    },
    {
      title: "New Customers",
      value: String(newCustomers),
      badge: trend(customerChange),
      detail: newCustomers + " customers added",
      description: "New in the last 30 days",
      down: customerChange !== null && customerChange < 0,
    },
    {
      title: "Active Accounts",
      value: String(active),
      badge:
        (workspace.contacts.length ? Math.round((active / workspace.contacts.length) * 100) : 0) +
        "% active",
      detail: active + " active relationships",
      description: customers.length + " existing customers",
      down: false,
    },
    {
      title: "Growth Rate",
      value: growth === null ? "—" : growth.toFixed(1) + "%",
      badge: trend(growth),
      detail: newContacts + " contacts added",
      description: "Vs. previous 30 days",
      down: growth !== null && growth < 0,
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.down ? TrendingDownIcon : TrendingUpIcon;
        return (
          <Card key={metric.title} className="@container/card">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Icon />
                  {metric.badge}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {metric.detail}
                <Icon className="size-4" />
              </div>
              <div className="text-muted-foreground">{metric.description}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
