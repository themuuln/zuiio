"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DrawerCancel, DrawerFooter } from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { laborKeys, productionKeys } from "@/lib/query/keys";
import {
  addLaborRecord,
  getOrderCostSummary,
  listActiveEmployees,
  removeLaborRecord,
} from "./labor-actions";
import { issueMaterials, returnMaterials } from "./material-actions";
import type { ProductionStageData } from "./production-actions";
import {
  advanceStage,
  cancelProductionOrder,
  getProductionOrder,
  updateProductionOrderStatus,
} from "./production-actions";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  in_progress: "Боловсруулж буй",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> =
  {
    pending: "secondary",
    in_progress: "default",
    completed: "default",
    cancelled: "destructive",
  };

const PRIORITY_LABELS: Record<string, string> = {
  low: "Бага",
  normal: "Хэвийн",
  high: "Өндөр",
  urgent: "Яаралтай",
};

const PRIORITY_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  low: "secondary",
  normal: "default",
  high: "default",
  urgent: "destructive",
};

const STAGE_STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  in_progress: "Боловсруулж буй",
  completed: "Дууссан",
  skipped: "Алгассан",
};

const STAGE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  skipped: "bg-yellow-500",
};

// ─── Labor Stage Card ──────────────────────────────────────────────────────
interface LaborStageCardProps {
  stage: ProductionStageData;
  employees: Array<{ id: string; full_name: string; position: string | null }>;
  addingLaborStageId: string | null;
  setAddingLaborStageId: (id: string | null) => void;
  laborEmployeeId: string;
  setLaborEmployeeId: (id: string) => void;
  laborHours: string;
  setLaborHours: (val: string) => void;
  laborRate: string;
  setLaborRate: (val: string) => void;
  isAddingLabor: boolean;
  laborError: string | null;
  onAddLabor: (stageId: string) => void;
  onRemoveLabor: (laborId: string, stageId: string) => void;
}

function LaborStageCard({
  stage,
  employees,
  addingLaborStageId,
  setAddingLaborStageId,
  laborEmployeeId,
  setLaborEmployeeId,
  laborHours,
  setLaborHours,
  laborRate,
  setLaborRate,
  isAddingLabor,
  laborError,
  onAddLabor,
  onRemoveLabor,
}: LaborStageCardProps) {
  const { data: laborData } = useQuery({
    queryKey: laborKeys.stage(stage.id),
    queryFn: async () => {
      const result = await getStageLaborSummary(stage.id);
      if (!result || "error" in result)
        throw new Error(result?.error ?? "Алдаа гарлаа");
      return result.data;
    },
    enabled: true,
  });

  const canAddLabor =
    stage.status === "in_progress" || stage.status === "completed";
  const isAdding = addingLaborStageId === stage.id;
  const records = laborData?.records ?? [];

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{stage.stage_name}</span>
          <span className="text-xs text-muted-foreground">
            {STAGE_STATUS_LABELS[stage.status] ?? stage.status}
          </span>
        </div>
        {canAddLabor && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingLaborStageId(isAdding ? null : stage.id)}
            aria-label={`${stage.stage_name} шатад ажилтан нэмэх`}
          >
            {isAdding ? "Цуцлах" : "Ажилтан нэмэх"}
          </Button>
        )}
      </div>

      {/* Labor records list */}
      {records.length > 0 ? (
        <div className="space-y-1">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between text-sm bg-muted/30 rounded px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{record.employee_name}</span>
                <span className="text-muted-foreground">
                  {record.hours} цаг ×{" "}
                  {formatCurrency(record.hourly_rate_snapshot)}/цаг
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatCurrency(record.labor_cost)}
                </span>
                {canAddLabor && stage.status === "in_progress" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-destructive"
                    onClick={() => onRemoveLabor(record.id, stage.id)}
                    aria-label={`${record.employee_name} ажилтыг устгах`}
                  >
                    Устгах
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Ажилтан бүртгээгүй</p>
      )}

      {/* Stage total */}
      {records.length > 0 && (
        <div className="flex items-center justify-between text-sm border-t pt-2">
          <span className="text-muted-foreground">Нийт:</span>
          <span className="font-medium">
            {laborData?.total_hours ?? 0} цаг —{" "}
            {formatCurrency(laborData?.total_cost ?? 0)}
          </span>
        </div>
      )}

      {/* Add labor form */}
      {isAdding && (
        <div className="space-y-3 border-t pt-3">
          {laborError && <ErrorBanner error={laborError} />}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label htmlFor={`labor-employee-${stage.id}`} className="text-xs">
                Ажилтан
              </Label>
              <Select
                value={laborEmployeeId}
                onValueChange={setLaborEmployeeId}
              >
                <SelectTrigger
                  id={`labor-employee-${stage.id}`}
                  aria-label="Ажилтан сонгох"
                >
                  <SelectValue placeholder="Сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`labor-hours-${stage.id}`} className="text-xs">
                Цаг
              </Label>
              <Input
                id={`labor-hours-${stage.id}`}
                type="number"
                min="0.5"
                step="0.5"
                placeholder="0"
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                aria-label="Ажилласан цаг"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`labor-rate-${stage.id}`} className="text-xs">
                Цалин/цаг
              </Label>
              <Input
                id={`labor-rate-${stage.id}`}
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={laborRate}
                onChange={(e) => setLaborRate(e.target.value)}
                aria-label="Цалинны хувь"
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={
              isAddingLabor || !laborEmployeeId || !laborHours || !laborRate
            }
            onClick={() => onAddLabor(stage.id)}
          >
            {isAddingLabor ? "Нэмж байна..." : "Бүртгэх"}
          </Button>
        </div>
      )}
    </div>
  );
}
function StageStepper({ stages }: { stages: ProductionStageData[] }) {
  const sorted = [...stages].sort((a, b) => a.stage_order - b.stage_order);

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-2">
      {sorted.map((stage, index) => (
        <div key={stage.id} className="flex items-start">
          <div className="flex flex-col items-center min-w-[80px]">
            {/* Dot */}
            {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: decorative status indicator */}
            <div
              role="img"
              className={`size-3 rounded-full ${STAGE_STATUS_COLORS[stage.status] ?? "bg-muted"} ring-2 ring-background`}
              aria-label={STAGE_STATUS_LABELS[stage.status] ?? stage.status}
            />
            {/* Label */}
            <div className="mt-1 text-center">
              <p className="text-xs font-medium leading-tight">
                {stage.stage_name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {STAGE_STATUS_LABELS[stage.status] ?? stage.status}
              </p>
              {stage.started_at && (
                <p className="text-[10px] text-muted-foreground">
                  Эхэлсэн: {formatDate(stage.started_at)}
                </p>
              )}
              {stage.completed_at && (
                <p className="text-[10px] text-muted-foreground">
                  Дууссан: {formatDate(stage.completed_at)}
                </p>
              )}
            </div>
          </div>
          {/* Connecting line */}
          {index < sorted.length - 1 && (
            <div className="mt-[5px] mx-1 h-[2px] w-12 bg-border flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export function ProductionDetailDrawer({
  orderId,
  open,
  onOpenChange,
  onRefresh,
}: {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
    new Set(),
  );
  const [issueQuantities, setIssueQuantities] = useState<
    Record<string, number>
  >({});
  const [returnQuantities, setReturnQuantities] = useState<
    Record<string, number>
  >({});
  const [isIssuing, setIsIssuing] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [materialActionError, setMaterialActionError] = useState<string | null>(
    null,
  );
  // Labor form state
  const [addingLaborStageId, setAddingLaborStageId] = useState<string | null>(
    null,
  );
  const [laborEmployeeId, setLaborEmployeeId] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [isAddingLabor, setIsAddingLabor] = useState(false);
  const [laborError, setLaborError] = useState<string | null>(null);

  const { data: order, isPending } = useQuery({
    queryKey: productionKeys.detail(orderId),
    queryFn: async () => {
      const result = await getProductionOrder(orderId);
      if (!result || "error" in result)
        throw new Error(result?.error ?? "Алдаа гарлаа");
      return result.data;
    },
    enabled: open,
  });

  const currentStage = order?.stages?.find(
    (s: ProductionStageData) => s.status === "in_progress",
  );
  const sortedStages = order?.stages
    ? [...order.stages].sort(
        (a: ProductionStageData, b: ProductionStageData) =>
          a.stage_order - b.stage_order,
      )
    : [];
  const currentStageIndex = currentStage
    ? sortedStages.findIndex(
        (s: ProductionStageData) => s.id === currentStage.id,
      )
    : -1;
  const hasNextStage =
    currentStageIndex >= 0 && currentStageIndex < sortedStages.length - 1;
  const canIssueMaterials =
    order && (order.status === "pending" || order.status === "in_progress");
  // Cost summary query
  const { data: costSummary } = useQuery({
    queryKey: laborKeys.costSummary(orderId),
    queryFn: async () => {
      const result = await getOrderCostSummary(orderId);
      if (!result || "error" in result)
        throw new Error(result?.error ?? "Алдаа гарлаа");
      return result.data;
    },
    enabled: open,
  });

  // Active employees for selector
  const { data: employees } = useQuery({
    queryKey: laborKeys.all(),
    queryFn: async () => {
      const result = await listActiveEmployees();
      if (!result || "error" in result)
        throw new Error(result?.error ?? "Алдаа гарлаа");
      return result.data;
    },
    enabled: open,
  });

  const materialIssueProgress = useMemo(() => {
    if (!order?.materials.length) return 0;
    const totalRequired = order.materials.reduce(
      (sum, m) => sum + m.required_quantity,
      0,
    );
    const totalIssued = order.materials.reduce(
      (sum, m) => sum + m.issued_quantity,
      0,
    );
    return totalRequired > 0
      ? Math.min(100, (totalIssued / totalRequired) * 100)
      : 0;
  }, [order?.materials]);

  const toggleMaterialSelection = useCallback((materialId: string) => {
    setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });
  }, []);

  const selectAllMaterials = useCallback(() => {
    if (!order?.materials) return;
    const allIds = new Set(order.materials.map((m) => m.id));
    setSelectedMaterials(allIds);
  }, [order?.materials]);

  const deselectAllMaterials = useCallback(() => {
    setSelectedMaterials(new Set());
  }, []);

  async function handleBulkIssue() {
    if (isIssuing || !order || selectedMaterials.size === 0) return;
    setIsIssuing(true);
    setMaterialActionError(null);
    try {
      const materialIds: string[] = [];
      const quantities: number[] = [];
      for (const mat of order.materials) {
        if (selectedMaterials.has(mat.id)) {
          materialIds.push(mat.id);
          quantities.push(
            issueQuantities[mat.id] ??
              mat.required_quantity - mat.issued_quantity,
          );
        }
      }
      if (materialIds.length === 0) {
        setMaterialActionError("Материал сонгоогүй байна.");
        return;
      }
      const result = await issueMaterials({
        order_id: orderId,
        material_ids: materialIds,
        quantities,
      });
      if (!result || "error" in result) {
        setMaterialActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productionKeys.detail(orderId),
      });
      onRefresh();
      toast.success("Материал амжилттай гаргалаа.");
      setSelectedMaterials(new Set());
      setIssueQuantities({});
    } catch (err) {
      capture(err, { context: "production: bulkIssue UI" });
      setMaterialActionError("Материал гаргахад алдаа гарлаа.");
    } finally {
      setIsIssuing(false);
    }
  }

  async function handleBulkReturn() {
    if (isReturning || !order || selectedMaterials.size === 0) return;
    setIsReturning(true);
    setMaterialActionError(null);
    try {
      const materialIds: string[] = [];
      const quantities: number[] = [];
      for (const mat of order.materials) {
        if (selectedMaterials.has(mat.id) && mat.issued_quantity > 0) {
          materialIds.push(mat.id);
          quantities.push(returnQuantities[mat.id] ?? mat.issued_quantity);
        }
      }
      if (materialIds.length === 0) {
        setMaterialActionError("Буцаах материал сонгоогүй байна.");
        return;
      }
      const result = await returnMaterials({
        order_id: orderId,
        material_ids: materialIds,
        quantities,
      });
      if (!result || "error" in result) {
        setMaterialActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productionKeys.detail(orderId),
      });
      onRefresh();
      toast.success("Материал амжилттай буцааллаа.");
      setSelectedMaterials(new Set());
      setReturnQuantities({});
    } catch (err) {
      capture(err, { context: "production: bulkReturn UI" });
      setMaterialActionError("Материал буцаахад алдаа гарлаа.");
    } finally {
      setIsReturning(false);
    }
  }

  async function handleStart() {
    if (isStarting) return;
    setIsStarting(true);
    setActionError(null);
    try {
      const result = await updateProductionOrderStatus({
        order_id: orderId,
        new_status: "in_progress",
      });
      if (!result || "error" in result) {
        setActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      onRefresh();
      toast.success("Захиалга эхэллээ.");
    } catch (err) {
      capture(err, { context: "production: startOrder UI" });
      setActionError("Захиалга эхлэхэд алдаа гарлаа.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleAdvance() {
    if (isAdvancing || !currentStage) return;
    setIsAdvancing(true);
    setActionError(null);
    try {
      const result = await advanceStage({
        stage_id: currentStage.id,
        new_status: "completed",
      });
      if (!result || "error" in result) {
        setActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: productionKeys.detail(orderId),
      });
      onRefresh();
      toast.success("Дараагийн шатанд шилжлээ.");
    } catch (err) {
      capture(err, { context: "production: advanceStage UI" });
      setActionError("Шат ахиулахад алдаа гарлаа.");
    } finally {
      setIsAdvancing(false);
    }
  }

  async function handleComplete() {
    if (isCompleting) return;
    setIsCompleting(true);
    setActionError(null);
    try {
      const result = await updateProductionOrderStatus({
        order_id: orderId,
        new_status: "completed",
      });
      if (!result || "error" in result) {
        setActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      onRefresh();
      toast.success("Захиалга дууслаа.");
    } catch (err) {
      capture(err, { context: "production: completeOrder UI" });
      setActionError("Захиалга дуусгахад алдаа гарлаа.");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleCancel() {
    if (isCancelling) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      const result = await cancelProductionOrder(orderId);
      if (!result || "error" in result) {
        setActionError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: productionKeys.all() });
      onOpenChange(false);
      toast.success("Захиалга цуцлагдлаа.");
    } catch (err) {
      capture(err, { context: "production: cancelOrder UI" });
      setActionError("Захиалга цуцлахад алдаа гарлаа.");
    } finally {
      setIsCancelling(false);
    }
  }
  async function handleAddLabor(stageId: string) {
    if (isAddingLabor || !laborEmployeeId || !laborHours || !laborRate) return;
    setIsAddingLabor(true);
    setLaborError(null);
    try {
      const result = await addLaborRecord({
        stage_id: stageId,
        employee_id: laborEmployeeId,
        hours: parseFloat(laborHours),
        hourly_rate: parseFloat(laborRate),
      });
      if (!result || "error" in result) {
        setLaborError(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: laborKeys.stage(stageId),
      });
      await queryClient.invalidateQueries({
        queryKey: laborKeys.costSummary(orderId),
      });
      onRefresh();
      toast.success("Ажилтан амжилттай нэмлээ.");
      setAddingLaborStageId(null);
      setLaborEmployeeId("");
      setLaborHours("");
      setLaborRate("");
    } catch (err) {
      capture(err, { context: "production: addLabor UI" });
      setLaborError("Ажилтан нэмэхэд алдаа гарлаа.");
    } finally {
      setIsAddingLabor(false);
    }
  }

  async function handleRemoveLabor(laborId: string, stageId: string) {
    try {
      const result = await removeLaborRecord(laborId);
      if (!result || "error" in result) {
        toast.error(result?.error ?? "Алдаа гарлаа");
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: laborKeys.stage(stageId),
      });
      await queryClient.invalidateQueries({
        queryKey: laborKeys.costSummary(orderId),
      });
      onRefresh();
      toast.success("Ажилтын бүртгэл устгагдлаа.");
    } catch (err) {
      capture(err, { context: "production: removeLabor UI" });
      toast.error("Ажилтан устгахад алдаа гарлаа.");
    }
  }

  return (
    <>
      <DrawerLayout
        open={open}
        onOpenChange={onOpenChange}
        title={order?.order_number ?? "Захиалгын дэлгэрэнгүй"}
        description={order ? (STATUS_LABELS[order.status] ?? order.status) : ""}
        footer={
          order &&
          order.status !== "completed" &&
          order.status !== "cancelled" ? (
            <DrawerFooter>
              <DrawerCancel onClick={() => onOpenChange(false)} />
              {order.status === "pending" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStart}
                  disabled={isStarting}
                  aria-label="Захиалга эхлүүлэх"
                >
                  {isStarting ? "Эхэлж байна..." : "Эхлүүлэх"}
                </Button>
              )}
              {order.status === "in_progress" && (
                <>
                  {hasNextStage && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAdvance}
                      disabled={isAdvancing}
                      aria-label="Дараагийн шатанд шилжүүлэх"
                    >
                      {isAdvancing ? "Ахиулж байна..." : "Дараагийн шат"}
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    aria-label="Захиалга дуусгах"
                  >
                    {isCompleting ? "Дуусгаж байна..." : "Дуусгах"}
                  </Button>
                </>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmCancel(true)}
                aria-label="Захиалга цуцлах"
              >
                Цуцлах
              </Button>
            </DrawerFooter>
          ) : (
            <DrawerFooter>
              <DrawerCancel onClick={() => onOpenChange(false)} />
            </DrawerFooter>
          )
        }
      >
        {isPending && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                key={i}
                className="h-8 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        )}
        {actionError && <ErrorBanner error={actionError} />}
        {order && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{order.order_number}</h3>
                <Badge variant={STATUS_VARIANTS[order.status] ?? "secondary"}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </Badge>
                <Badge
                  variant={PRIORITY_VARIANTS[order.priority] ?? "secondary"}
                >
                  {PRIORITY_LABELS[order.priority] ?? order.priority}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Бүтээгдэхүүн: </span>
                  <span className="font-medium">{order.product_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">BOM: </span>
                  <span className="font-medium">v{order.bom_version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Тоо: </span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                {order.planned_start_date && (
                  <div>
                    <span className="text-muted-foreground">Эхлэх: </span>
                    <span className="font-medium">
                      {formatDate(order.planned_start_date)}
                    </span>
                  </div>
                )}
                {order.planned_end_date && (
                  <div>
                    <span className="text-muted-foreground">Дуусах: </span>
                    <span className="font-medium">
                      {formatDate(order.planned_end_date)}
                    </span>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Тэмдэглэл: </span>
                    <span className="font-medium">{order.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Timeline */}
            {order.stages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Үйлдвэрлэлийн шатууд</h4>
                <div className="rounded-lg border p-3">
                  <StageStepper stages={order.stages} />
                </div>
              </div>
            )}
            {/* Labor Records */}
            {sortedStages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Хөдөлмөрийн бүртгэл</h4>
                {sortedStages.map((stage) => (
                  <LaborStageCard
                    key={stage.id}
                    stage={stage}
                    employees={employees ?? []}
                    addingLaborStageId={addingLaborStageId}
                    setAddingLaborStageId={setAddingLaborStageId}
                    laborEmployeeId={laborEmployeeId}
                    setLaborEmployeeId={setLaborEmployeeId}
                    laborHours={laborHours}
                    setLaborHours={setLaborHours}
                    laborRate={laborRate}
                    setLaborRate={setLaborRate}
                    isAddingLabor={isAddingLabor}
                    laborError={laborError}
                    onAddLabor={handleAddLabor}
                    onRemoveLabor={handleRemoveLabor}
                  />
                ))}
              </div>
            )}

            {/* Material Issue & Return */}
            {order.materials.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Материалын гаргалт/буцаалт
                  </h4>
                  {canIssueMaterials && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllMaterials}
                        aria-label="Бүх материалыг сонгох"
                      >
                        Бүгдийг сонгох
                      </Button>
                      {selectedMaterials.size > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={deselectAllMaterials}
                          aria-label="Сонголтыг цуцлах"
                        >
                          Цуцлах
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Гаргасан хэмжээ</span>
                    <span>{Math.round(materialIssueProgress)}%</span>
                  </div>
                  <Progress
                    value={materialIssueProgress}
                    aria-label="Материал гаргасан хувь"
                  />
                </div>

                {materialActionError && (
                  <ErrorBanner error={materialActionError} />
                )}

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canIssueMaterials && (
                          <TableHead className="w-10">
                            <span className="sr-only">Сонгох</span>
                          </TableHead>
                        )}
                        <TableHead>Материал</TableHead>
                        <TableHead className="text-right">
                          Шаардлагатай
                        </TableHead>
                        <TableHead className="text-right">Гаргасан</TableHead>
                        <TableHead className="text-right">Үлдсэн</TableHead>
                        <TableHead className="text-right">Буцаасан</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.materials.map((mat) => {
                        const remaining =
                          mat.required_quantity - mat.issued_quantity;
                        const isSelected = selectedMaterials.has(mat.id);
                        return (
                          <TableRow
                            key={mat.id}
                            className={isSelected ? "bg-muted/50" : undefined}
                          >
                            {canIssueMaterials && (
                              <TableCell>
                                <input
                                  type="checkbox"
                                  className="size-4 accent-primary"
                                  checked={isSelected}
                                  onChange={() =>
                                    toggleMaterialSelection(mat.id)
                                  }
                                  aria-label={`${mat.product_name} сонгох`}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              {mat.product_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {mat.required_quantity} {mat.unit}
                            </TableCell>
                            <TableCell className="text-right">
                              {mat.issued_quantity} {mat.unit}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={
                                  remaining > 0
                                    ? "text-muted-foreground"
                                    : "text-green-600"
                                }
                              >
                                {remaining > 0 ? remaining : 0} {mat.unit}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {mat.returned_quantity} {mat.unit}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Issue/Return action buttons */}
                {canIssueMaterials && selectedMaterials.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={isIssuing}
                      onClick={handleBulkIssue}
                      aria-label="Сонгосон материалыг гаргах"
                    >
                      {isIssuing
                        ? "Гаргаж байна..."
                        : `Гаргах (${selectedMaterials.size})`}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isReturning}
                      onClick={handleBulkReturn}
                      aria-label="Сонгосон материалыг буцаах"
                    >
                      {isReturning
                        ? "Буцааж байна..."
                        : `Буцаах (${selectedMaterials.size})`}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Cost Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Зардал</h4>
              <div className="rounded-lg border divide-y">
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-muted-foreground">
                    Төлөвлөсөн зардал:
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(order.estimated_cost_snapshot)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-muted-foreground">
                    Материалын зардал:
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(costSummary?.material_actual_cost ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="text-sm text-muted-foreground">
                    Хөдөлмөрийн зардал:
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(costSummary?.labor_actual_cost ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50">
                  <span className="text-sm font-medium">Нийт зардал:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(costSummary?.total_actual_cost ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue & Profit */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Орлого ба ашиг</h4>
              {order.sale_item_id ? (
                <div className="rounded-lg border divide-y">
                  <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">
                      Орлого:
                    </span>
                    <span className="text-sm font-medium">
                      {costSummary?.revenue !== null
                        ? formatCurrency(costSummary.revenue)
                        : "Олдсонгүй"}
                    </span>
                  </div>
                  {costSummary?.profit !== null && (
                    <div className="flex items-center justify-between p-3 bg-muted/50">
                      <span className="text-sm font-medium">
                        Ашиг/Алдагдал:
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          costSummary.profit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(costSummary.profit)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border p-3">
                  <span className="text-sm text-muted-foreground">
                    Орлого холбоогүй
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </DrawerLayout>

      {/* Cancel Confirmation */}
      <SlideInDrawer
        key={String(confirmCancel)}
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Захиалга цуцлах"
        description="Энэ үйлдлыг буцаах боломжгүй."
        panelWidth="24rem"
        footer={
          <DrawerFooter>
            <DrawerCancel onClick={() => setConfirmCancel(false)} />
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCancelling ? "Цуцалж байна..." : "Цуцлах"}
            </button>
          </DrawerFooter>
        }
      >
        <div className="space-y-4">
          {actionError && <ErrorBanner error={actionError} />}
          <p className="text-sm text-muted-foreground">
            Захиалгыг цуцлах уу? Захиалгын бүх шатууд цуцлагдана.
          </p>
        </div>
      </SlideInDrawer>
    </>
  );
}
