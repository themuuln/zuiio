"use client";

import { useOrgMutation } from "@zuiio/query";
import { Calendar, User, UserPlus, Wrench } from "lucide-react";
import { useLocale } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { workOrderKeys } from "@/lib/queries/keys";
import { reportServerError } from "@/lib/sentry-report-server";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import type { BayCardMechanic } from "./_bay-card-types";
import { MechanicDisplay } from "./_mechanic-display";
import { StatusTimeline } from "./_status-timeline";

// ── Props ───────────────────────────────────────────────────────

interface DrawerSidebarProps {
  wo: WorkOrderDetail;
  allMechanics: BayCardMechanic[];
  helpers: MechanicRef[];
  orgId: string;
  workOrderId: string;
  onShowCustomerPicker: () => void;
  onAssignMechanic: (
    mechanicId: string,
    fullName?: string | null,
  ) => Promise<void>;
  onHelpersChange: () => void;
  t: (key: string, params?: Record<string, string | number | Date>) => string;
}

// ── Component ───────────────────────────────────────────────────

function DrawerSidebarInner({
  wo,
  allMechanics,
  helpers,
  orgId,
  workOrderId,
  onShowCustomerPicker,
  onAssignMechanic,
  onHelpersChange,
  t,
}: DrawerSidebarProps) {
  const locale = useLocale();

  // ── Helper mutations ──────────────────────────────────────────

  const addHelperMutation = useOrgMutation<unknown, { mechanic_id: string }>({
    endpoint: () =>
      `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
    method: "POST",
    queryKey: workOrderKeys.all(orgId),
    onSuccess: () => {
      onHelpersChange();
    },
  });

  const removeHelperMutation = useOrgMutation<unknown, { mechanicId: string }>({
    endpoint: (vars) =>
      `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${vars.mechanicId}`,
    method: "DELETE",
    queryKey: workOrderKeys.all(orgId),
    onSuccess: () => {
      onHelpersChange();
    },
  });

  // ── Ensure assigned mechanic is in the list ───────────────────

  const effectiveMechanics = useMemo(() => {
    if (!wo?.mechanic_id || !wo.mechanic) return allMechanics;
    const alreadyIncluded = allMechanics.some((m) => m.id === wo.mechanic_id);
    if (alreadyIncluded) return allMechanics;
    return [
      {
        id: wo.mechanic.id,
        full_name: wo.mechanic.full_name ?? t("unknownCustomer"),
      },
      ...allMechanics,
    ];
  }, [wo?.mechanic_id, wo?.mechanic, allMechanics, t]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleAssignMechanic = useCallback(
    async (_woId: string, mechanicId: string) => {
      const mech = effectiveMechanics.find((m) => m.id === mechanicId);
      await onAssignMechanic(mechanicId, mech?.full_name);
    },
    [effectiveMechanics, onAssignMechanic],
  );

  const handleAddHelper = useCallback(
    async (_woId: string, mechanicId: string) => {
      try {
        await addHelperMutation.mutateAsync({ mechanic_id: mechanicId });
      } catch (err) {
        reportServerError("Failed to add helper", err);
        toast.error("Failed to add helper");
      }
    },
    [addHelperMutation],
  );

  const handleRemoveMechanic = useCallback(
    async (_woId: string) => {
      try {
        await removeHelperMutation.mutateAsync({
          mechanicId: wo?.mechanic?.id ?? "",
        });
      } catch (err) {
        reportServerError("Failed to remove mechanic", err);
        toast.error("Failed to remove mechanic");
      }
    },
    [removeHelperMutation, wo?.mechanic?.id],
  );

  const handleRemoveHelper = useCallback(
    async (_woId: string, mechanicId: string) => {
      try {
        await removeHelperMutation.mutateAsync({ mechanicId });
      } catch (err) {
        reportServerError("Failed to remove helper", err);
        toast.error("Failed to remove helper");
      }
    },
    [removeHelperMutation],
  );

  // ── Derived ───────────────────────────────────────────────────

  const customerName = wo.customer
    ? [wo.customer.first_name, wo.customer.last_name]
        .filter(Boolean)
        .join(" ") ||
      wo.customer.phone ||
      t("unknownCustomer")
    : null;

  // ── Render ────────────────────────────────────────────────────

  return (
    <aside className="flex flex-col gap-3">
      {/* ── Customer Card ──────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <User className="size-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("listHeaderCustomer")}
          </span>
        </div>
        {customerName ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {customerName}
              </p>
              {wo.customer?.phone && (
                <p className="truncate text-xs text-muted-foreground/70">
                  {wo.customer.phone}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onShowCustomerPicker}
              className="shrink-0 text-muted-foreground/40 hover:text-foreground"
              aria-label={t("changeCustomer") ?? "Change customer"}
            >
              <UserPlus className="size-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onShowCustomerPicker}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-muted/50">
              <User className="size-3.5 text-muted-foreground/50" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t("selectCustomer")}
            </span>
          </button>
        )}
      </div>

      {/* ── Mechanic Card ──────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Wrench className="size-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("listHeaderMechanic")}
          </span>
        </div>
        <MechanicDisplay
          variant="row"
          workOrderId={workOrderId}
          mechanic={wo.mechanic}
          helpers={helpers}
          status={wo.status}
          allMechanics={effectiveMechanics}
          onAssignMechanic={handleAssignMechanic}
          onAddHelper={handleAddHelper}
          onRemoveMechanic={handleRemoveMechanic}
          onRemoveHelper={handleRemoveHelper}
        />
      </div>

      {/* ── Timeline Card ──────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-3">
        <StatusTimeline
          mode="status"
          statusHistory={wo.status_history ?? []}
          serviceHistory={wo.service_history ?? []}
          t={t}
        />
      </div>

      {/* ── Vehicle Info Card ───────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {locale === "mn" ? "Цаг хугацаа" : "Timeline"}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {wo.created_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">
                {locale === "mn" ? "Үүсгэсэн" : "Created"}
              </span>
              <span className="tabular-nums text-foreground/70">
                {new Date(wo.created_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {wo.started_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">
                {locale === "mn" ? "Эхэлсэн" : "Started"}
              </span>
              <span className="tabular-nums text-foreground/70">
                {new Date(wo.started_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {wo.completed_at && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground/60">
                {locale === "mn" ? "Дууссан" : "Completed"}
              </span>
              <span className="tabular-nums text-foreground/70">
                {new Date(wo.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export const DrawerSidebar = memo(DrawerSidebarInner);
