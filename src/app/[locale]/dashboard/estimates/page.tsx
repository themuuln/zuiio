"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

import { useRouter } from "@/lib/i18n/navigation";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Estimate } from "@/lib/types";

// ── Status helpers ────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500",
  sent: "bg-blue-500",
  approved: "bg-green-500",
  declined: "bg-red-500",
  expired: "bg-yellow-500",
  converted: "bg-purple-500",
};

// ── Main Page ──────────────────────────────────────────────────

export default function EstimatesPage() {
  const router = useRouter();
  const { data: org } = useCurrentOrg();
  const [statusFilter, setStatusFilter] = useState("all");
  const orgId = org?.orgId ?? "";

  // Fetch estimates
  const { data: estimates, isLoading } = useQuery({
    queryKey: ["estimates", orgId],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/estimates`);
      const json = await res.json();
      return (json.data ?? []) as Estimate[];
    },
    enabled: !!orgId,
  });

  // Filter
  const filtered = (estimates ?? []).filter((e) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active")
      return ["draft", "sent", "approved"].includes(e.status);
    return e.status === statusFilter;
  });

  const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat("mn-MN").format(Number(val));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v ?? "all")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active (Draft/Sent/Approved)</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => router.push("/dashboard/estimates/new")}>
          <Plus className="size-4" />
          New Quote
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="size-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No quotes</EmptyTitle>
            <EmptyDescription>
              Create a quote to send to a customer. When approved, it converts
              to a work order.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push("/dashboard/estimates/new")}>
              <Plus className="size-4" />
              Create Quote
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-2">
          {filtered.map((estimate) => (
            <div
              key={estimate.id}
              className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/20 cursor-pointer transition-colors"
              onClick={() => router.push(`/dashboard/estimates/${estimate.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  router.push(`/dashboard/estimates/${estimate.id}`);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Typography.Text className="font-mono text-sm font-medium">
                    {estimate.estimate_number}
                  </Typography.Text>
                  <Badge
                    variant="outline"
                    className={`${STATUS_COLORS[estimate.status] ?? "bg-gray-500"} text-white border-0`}
                  >
                    {STATUS_LABELS[estimate.status] ?? estimate.status}
                  </Badge>
                </div>
                <Typography.Text className="text-sm text-muted-foreground block truncate mt-0.5">
                  Created {new Date(estimate.created_at).toLocaleDateString()}
                  {estimate.customer_id &&
                    " · Customer ID: " + estimate.customer_id.slice(0, 8)}
                </Typography.Text>
              </div>
              <div className="text-right">
                <Typography.Text className="font-mono font-semibold">
                  ₮{formatCurrency(estimate.grand_total)}
                </Typography.Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
