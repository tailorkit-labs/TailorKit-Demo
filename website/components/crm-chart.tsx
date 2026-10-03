"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from "recharts";

import type { Deal } from "@/lib/workspace";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "An interactive area chart";

export function CrmChart({ deals }: { deals: Deal[] }) {
  const [timeRange, setTimeRange] = React.useState("90d");
  const gradientId = React.useId().replace(/:/g, "");
  const reference = new Date();
  reference.setUTCHours(23, 59, 59, 999);
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const filteredData = Array.from({ length: days }, (_, index) => {
    const day = new Date(reference);
    day.setUTCDate(day.getUTCDate() - days + index + 1);
    const records = deals.filter((deal) => new Date(deal.createdAt) <= day);
    return {
      date: day.toISOString().slice(0, 10),
      desktop: records
        .filter((deal) => deal.stage !== "won" && deal.stage !== "lost")
        .reduce((sum, deal) => sum + deal.value, 0),
      mobile: records
        .filter((deal) => deal.stage === "won")
        .reduce((sum, deal) => sum + deal.value, 0),
    };
  });

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Opportunity value</CardTitle>
        <CardDescription>Cumulative value by creation date and current stage</CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d");
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle]:px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            items={[
              { value: "90d", label: "Last 3 months" },
              { value: "30d", label: "Last 30 days" },
              { value: "7d", label: "Last 7 days" },
            ]}
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Chart date range"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="h-[250px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} accessibilityLayer>
              <defs>
                <linearGradient id={gradientId + "-open"} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={1.0} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id={gradientId + "-won"} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  });
                }}
              />
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                }}
                labelFormatter={(value) =>
                  new Date(String(value)).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })
                }
                formatter={(value, name) => [
                  "$" + Number(value).toLocaleString("en-US"),
                  name === "desktop" ? "Open pipeline" : "Won deals",
                ]}
              />
              <Area
                dataKey="mobile"
                type="natural"
                fill={"url(#" + gradientId + "-won)"}
                stroke="var(--chart-2)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill={"url(#" + gradientId + "-open)"}
                stroke="var(--primary)"
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
