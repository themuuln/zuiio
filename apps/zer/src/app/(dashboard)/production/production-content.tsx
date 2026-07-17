"use client";

import {
  Check,
  CheckCircle,
  Clock,
  Eye,
  Hammer,
  Play,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productionKeys } from "@/lib/query/keys";
import { actionsColumn, dateColumn, textColumn } from "@/lib/table-columns";
import {
  cancelProductionOrder,
  getProductionOrderStats,
  listProductionOrders,
  type ProductionOrderListItem,
  updateProductionOrderStatus,
} from "./production-actions";
import { ProductionCreateDrawer } from "./production-create-drawer";
import { ProductionDetailDrawer } from "./production-detail-drawer";

// ─── Status config ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  in_progress: "Боловсруулж буй",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  in_progress: "default",
  completed: "secondary",
  cancelled: "destructive",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Бага",
  normal: "Энгийн",
  high: "Өндөр",
  urgent: "Яаралтай",
};

const PRIORITY_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

const STATUS_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  pending: Clock,
  in_progress: Hammer,
  completed: CheckCircle,
  cancelled: XCircle,
};

// ─── Stats card ────────────────────────────────────────────────────────────

function StatsCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  isLoading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "secondary" | "destructive" | "outline";
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

export function ProductionContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] =
    useState<ProductionOrderListItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Stats query
  const { data: statsData, isPending: statsPending } = useQuery({
    queryKey: productionKeys.all(),
    queryFn: async () => {
      const result = await getProductionOrderStats();
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
  });

  // Orders list query
  const { data: orders = [], isPending } = useQuery({
    queryKey: [...productionKeys.all(), "list"],
    queryFn: async () => {
      const result = await listProductionOrders();
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
  });

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // ─── Mutations ─────────────────────────────────────────────────────────

  const startMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const result = await updateProductionOrderStatus({
        order_id: orderId,
        new_status: "in_progress",
      });
      if ("error" in result) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      toast.success("Захиалгыг эхлүүллээ.");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Алдаа гарлаа.");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const result = await updateProductionOrderStatus({
        order_id: orderId,
        new_status: "completed",
      });
      if ("error" in result) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      toast.success("Захиалгыг дуусгалаа.");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Алдаа гарлаа.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const result = await cancelProductionOrder(orderId);
      if ("error" in result) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      toast.success("Захиалгыг цуцаллаа.");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Алдаа гарлаа.");
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────

  function handleStart(order: ProductionOrderListItem) {
    startMutation.mutate(order.id);
  }

  function handleComplete(order: ProductionOrderListItem) {
    completeMutation.mutate(order.id);
  }

  function handleCancel(order: ProductionOrderListItem) {
    cancelMutation.mutate(order.id);
  }

  // ─── Loading state ────────────────────────────────────────────────────

  if (isPending) {
    return (
      <PageShell
        title="Үйлдвэрлэл"
        description="Үйлдвэрлэлийн захиалгын жагсаалт"
      >
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded bg-muted"
            />
          ))}
        </div>
      </PageShell>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────────────

  if (orders.length === 0) {
    return (
      <PageShell
        title="Үйлдвэрлэл"
        description="Үйлдвэрлэлийн захиалгын жагсаалт"
        actions={
          <ProductionCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        }
      >
        <ErpEmptyState
          icon={<Hammer className="size-4" />}
          title="Үйлдвэрлэлийн захиалга байхгүй"
          description="Шинэ үйлдвэрлэлийн захиалга үүсгэнэ үү."
          action={
            <ProductionCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          }
        />
      </PageShell>
    );
  }

  // ─── Table columns ────────────────────────────────────────────────────

  const columns: ColumnDef<ProductionOrderListItem>[] = [
    {
      accessorKey: "order_number",
      header: "Дугаар",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.order_number}</span>
      ),
    },
    textColumn("product_name", "Бүтээгдэхүүн"),
    {
      accessorKey: "quantity",
      header: "Тоо ширхэг",
      cell: ({ row }) => (
        <span className="text-right tabular-nums">{row.original.quantity}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Төлөв",
      cell: ({ row }) => {
        const Icon = STATUS_ICONS[row.original.status];
        return (
          <Badge variant={STATUS_VARIANTS[row.original.status] ?? "secondary"}>
            {Icon && <Icon className="mr-1 size-3" />}
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Тэргүүлэх",
      cell: ({ row }) => (
        <Badge
          variant={PRIORITY_VARIANTS[row.original.priority] ?? "secondary"}
        >
          {PRIORITY_LABELS[row.original.priority] ?? row.original.priority}
        </Badge>
      ),
    },
    dateColumn("planned_start_date", "Эхлэх огноо"),
    actionsColumn("Үйлдэл", (row) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedOrder(row)}
          aria-label={`${row.order_number} захиалга харах`}
        >
          <Eye className="size-4" />
          <span className="sr-only">Харах</span>
        </Button>
        {row.status === "pending" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStart(row)}
            disabled={startMutation.isPending}
            aria-label={`${row.order_number} захиалгыг эхлүүлэх`}
          >
            <Play className="size-4" />
            <span className="sr-only">Эхлүүлэх</span>
          </Button>
        )}
        {row.status === "in_progress" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleComplete(row)}
              disabled={completeMutation.isPending}
              aria-label={`${row.order_number} захиалгыг дуусгах`}
            >
              <Check className="size-4" />
              <span className="sr-only">Дуусгах</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancel(row)}
              disabled={cancelMutation.isPending}
              aria-label={`${row.order_number} захиалгыг цуцлах`}
            >
              <Warning className="size-4" />
              <span className="sr-only">Цуцлах</span>
            </Button>
          </>
        )}
      </div>
    )),
  ];

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <>
      <PageShell
        title="Үйлдвэрлэл"
        description="Үйлдвэрлэлийн захиалгын жагсаалт"
        actions={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]" aria-label="Төлөвөөр шүүх">
                <SelectValue placeholder="Бүх төлөв" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Бүх төлөв</SelectItem>
                <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
                <SelectItem value="in_progress">Боловсруулж буй</SelectItem>
                <SelectItem value="completed">Дууссан</SelectItem>
                <SelectItem value="cancelled">Цуцлагдсан</SelectItem>
              </SelectContent>
            </Select>
            <ProductionCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          </div>
        }
      >
        {/* Stats cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatsCard
            label="Хүлээгдэж буй"
            value={statsData?.pending ?? 0}
            icon={Clock}
            variant="outline"
            isLoading={statsPending}
          />
          <StatsCard
            label="Боловсруулж буй"
            value={statsData?.in_progress ?? 0}
            icon={Hammer}
            isLoading={statsPending}
          />
          <StatsCard
            label="Дууссан"
            value={statsData?.completed ?? 0}
            icon={CheckCircle}
            isLoading={statsPending}
          />
          <StatsCard
            label="Цуцлагдсан"
            value={statsData?.cancelled ?? 0}
            icon={XCircle}
            variant="destructive"
            isLoading={statsPending}
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          searchColumn="order_number"
          searchPlaceholder="Захиалгын дугаар хайх..."
          pageSize={10}
          totalLabel="захиалга"
          enableSorting
          enableColumnVisibility
          onRowClick={(row) => setSelectedOrder(row)}
        />
      </PageShell>

      {/* Detail drawer */}
      {selectedOrder && (
        <ProductionDetailDrawer
          orderId={selectedOrder.id}
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: productionKeys.all() })
          }
        />
      )}
    </>
  );
}
