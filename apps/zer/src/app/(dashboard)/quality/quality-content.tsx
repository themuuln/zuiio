"use client";

import {
  CheckCircle,
  ListChecks,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { qualityKeys } from "@/lib/query/keys";
import { dateColumn, textColumn } from "@/lib/table-columns";
import {
  listQualityChecks,
  type QualityCheckListItem,
} from "./quality-actions";
import { QualityCreateDrawer } from "./quality-create-drawer";

// ─── Config ────────────────────────────────────────────────────────────────

const CHECK_TYPE_LABELS: Record<string, string> = {
  in_process: "Үйлдвэрлэлийн явцад",
  final: "Эцэслэх шалгалт",
};

const CHECK_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> =
  {
    in_process: "secondary",
    final: "default",
  };

const RESULT_LABELS: Record<string, string> = {
  pass: "Өнгөрсөн",
  fail: "Унасан",
  conditional: "Нөхцөлт",
};

const RESULT_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pass: "default",
  fail: "destructive",
  conditional: "outline",
};

const RESULT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  pass: CheckCircle,
  fail: XCircle,
  conditional: Warning,
};

const RESULT_COLORS: Record<string, string> = {
  pass: "text-green-600",
  fail: "text-red-600",
  conditional: "text-yellow-600",
};

// ─── Stats card ────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  icon: Icon,

  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-7 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function QualityContent() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Quality checks list query
  const { data: checks = [], isPending } = useQuery<QualityCheckListItem[]>({
    queryKey: qualityKeys.all(),
    queryFn: async () => {
      const result = await listQualityChecks();
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
  });

  // Compute stats from the list
  const stats = {
    total: checks.length,
    pass: checks.filter((c) => c.result === "pass").length,
    fail: checks.filter((c) => c.result === "fail").length,
    conditional: checks.filter((c) => c.result === "conditional").length,
  };

  // Apply filters
  const filteredChecks = checks.filter((c) => {
    if (typeFilter !== "all" && c.check_type !== typeFilter) return false;
    if (resultFilter !== "all" && c.result !== resultFilter) return false;
    return true;
  });

  // ─── Columns ───────────────────────────────────────────────────────────

  const columns: ColumnDef<QualityCheckListItem>[] = [
    textColumn("order_number", "Захиалга"),
    {
      accessorKey: "check_type",
      header: "Шалгалтын төрөл",
      cell: ({ row }) => {
        const type = row.getValue("check_type") as string;
        return (
          <Badge variant={CHECK_TYPE_VARIANTS[type] ?? "secondary"}>
            {CHECK_TYPE_LABELS[type] ?? type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "result",
      header: "Үр дүн",
      cell: ({ row }) => {
        const result = row.getValue("result") as string;
        const Icon = RESULT_ICONS[result];
        return (
          <span className="inline-flex items-center gap-1.5">
            {Icon && (
              <Icon className={`size-4 ${RESULT_COLORS[result] ?? ""}`} />
            )}
            <Badge variant={RESULT_VARIANTS[result] ?? "secondary"}>
              {RESULT_LABELS[result] ?? result}
            </Badge>
          </span>
        );
      },
    },
    {
      accessorKey: "stage_name",
      header: "Шат",
      cell: ({ row }) => {
        const stage = row.getValue("stage_name") as string | null;
        return stage ?? "-";
      },
    },
    {
      accessorKey: "defect_photos",
      header: "Зураг",
      cell: ({ row }) => {
        const photos = row.getValue("defect_photos") as string[] | null;
        const count = photos?.length ?? 0;
        return count > 0 ? (
          <span className="text-sm text-muted-foreground">{count} зураг</span>
        ) : (
          "-"
        );
      },
    },
    dateColumn("checked_at", "Огноо"),
  ];

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Чанарын хяналт"
      description="Үйлдвэрлэлийн захиалгуудын чанарын шалгалтын бүртгэл"
      actions={
        <QualityCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
      }
    >
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard
          label="Нийт шалгалт"
          value={stats.total}
          icon={ListChecks}
          isLoading={isPending}
        />
        <StatsCard
          label="Өнгөрсөн"
          value={stats.pass}
          icon={CheckCircle}
          isLoading={isPending}
        />
        <StatsCard
          label="Унасан"
          value={stats.fail}
          icon={XCircle}
          isLoading={isPending}
        />
        <StatsCard
          label="Нөхцөлт"
          value={stats.conditional}
          icon={Warning}
          isLoading={isPending}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="w-[200px]"
            aria-label="Шалгалтын төрөлөөр шүүх"
          >
            <SelectValue placeholder="Бүх төрөл" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төрөл</SelectItem>
            <SelectItem value="in_process">Үйлдвэрлэлийн явцад</SelectItem>
            <SelectItem value="final">Эцэслэх шалгалт</SelectItem>
          </SelectContent>
        </Select>

        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[200px]" aria-label="Үр дүнгээр шүүх">
            <SelectValue placeholder="Бүх үр дүн" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх үр дүн</SelectItem>
            <SelectItem value="pass">Өнгөрсөн</SelectItem>
            <SelectItem value="fail">Унасан</SelectItem>
            <SelectItem value="conditional">Нөхцөлт</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table or empty state */}
      {isPending || filteredChecks.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredChecks}
          loading={isPending}
          searchPlaceholder="Шалгалт хайх..."
          searchColumn="order_number"
        />
      ) : (
        <ErpEmptyState
          icon={<ListChecks className="size-6" />}
          title="Чанарын шалгалт байхгүй"
          description="Эхний шалгалтыг бүртгэх бол Шинэ шалгалт товчийг дарна уу."
          action={
            <QualityCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      )}

      {/* Create drawer */}
      <QualityCreateDrawer open={createOpen} onOpenChange={setCreateOpen} />
    </PageShell>
  );
}
