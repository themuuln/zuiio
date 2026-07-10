"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { User, UserPlus } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { VariantSelectionDialog } from "@/components/services/variant-selection-dialog";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import {
  drawerDetailKeys,
  useDrawerQueries,
} from "@/lib/queries/use-drawer-queries";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import { reportServerError } from "@/lib/sentry-report-server";
import { savePostServiceData } from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";
import { CustomerPickerModal } from "./_customer-picker-modal";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerContentPanel } from "./_drawer-content-panel";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerSkeleton } from "./_drawer-loading";
import { DrawerNestedForms } from "./_drawer-nested-forms";
import { DrawerSkeletonLayout } from "./_drawer-skeleton-layout";
import type { WorkOrderDetailDrawerProps } from "./_drawer-types";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { createInvoiceAndRecordPayment } from "./_payment-helpers";
import { useDrawerMutations } from "./_use-drawer-mutations";
import { useVariantSelection } from "./_use-variant-selection";

const WorkOrderQuickActions = dynamic(
  () => import("./_quick-actions").then((m) => m.QuickActions),
  { ssr: false },
);

// ── Drawer ───────────────────────────────────────────────────

export function WorkOrderDetailDrawer({
  workOrderId,
  open,
  onOpenChange,
  onRefresh,
  initialAction,
  branchFilter,
  assignMechanicMutation: drawerAssignMechanicMutation,
  assignCustomerMutation: drawerAssignCustomerMutation,
}: WorkOrderDetailDrawerProps) {
  const t = useTranslations("bayView");

  const queryClient = useQueryClient();

  // ── Data layer ──

  const {
    orgId,
    orgIdRef,
    wo,
    setWo,
    catalog,
    partsCatalog,
    mechanics,
    isLoading,
    error,
  } = useDrawerQueries(workOrderId);

  const { settings: orgSettings } = useOrgSettings(orgId ?? undefined);
  const paymentMethodFees = resolvePaymentMethodFees(
    orgSettings?.payment_method_fees,
  );
  const transferBanks = resolveOrgTransferBanks(
    normalizeOrgTransferBankAccounts(orgSettings?.transfer_bank_accounts),
  );

  // PPR: render layout skeleton immediately, no spinner. Once data loads,
  // wo becomes non-null and the shell preserves on refetches.

  // fetchWo: refetch the work order detail query
  const fetchWo = useCallback(
    async (silent = false) => {
      if (!orgId || !workOrderId) return;
      const key = drawerDetailKeys.all(orgId, workOrderId);
      if (silent) {
        await queryClient.invalidateQueries({ queryKey: key });
      } else {
        await queryClient.refetchQueries({ queryKey: key });
      }
    },
    [orgId, workOrderId, queryClient],
  );

  // ── Computed totals ──

  const servicesTotal = useMemo(
    () => wo?.services?.reduce((s, svc) => s + Number(svc.final_price), 0) ?? 0,
    [wo?.services],
  );
  const partsTotal = useMemo(
    () => wo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ?? 0,
    [wo?.parts],
  );
  const grandTotal = servicesTotal + partsTotal;

  // ── Mutations layer ──

  const {
    saving,
    isConfirming,
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    showAddPart,
    setShowAddPart,
    partSearch,
    setPartSearch,
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    creatingInvoice,
    showPostServiceForm,
    showUnsavedWarning,
    setShowUnsavedWarning,
    addService,
    addPart,
    handleServicePriceSave,
    handleServiceQtySave,
    handlePartPriceSave,
    handlePartQtySave,
    assignMechanic,
    assignCustomer,
    changeStatus,
    generateInvoice,
    handleCancelPostService,
    handleOpenChange,
    handleSaveAndClose,
    handleDiscard,
    canCancel,
    canInvoice,
    invoicePublicToken,
    lastAddedServiceId,
    lastAddedPartId,
  } = useDrawerMutations({
    workOrderId,
    orgIdRef,
    orgId: orgId ?? undefined,
    wo,
    setWo,
    fetchWo,
    onRefresh,
    onOpenChange,
    paymentMethodFees,
    transferBanks,
    branchId: branchFilter,
    assignMechanicMutation: drawerAssignMechanicMutation,
    assignCustomerMutation: drawerAssignCustomerMutation,
  });

  // ── Inline mutations for status transitions ──

  const completeMutation = useOrgMutation<
    unknown,
    { status: string; notes?: string }
  >({
    endpoint: () =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchFilter
      ? ([bayViewKeys.data(branchFilter)] as const)
      : undefined,
  });

  const nuatMutation = useOrgMutation<unknown, { nuat_enabled: boolean }>({
    endpoint: () => `/api/organizations/${orgId}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    invalidateKeys: branchFilter
      ? ([bayViewKeys.data(branchFilter)] as const)
      : undefined,
  });

  // ── Local-only state ──

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showReadyForm, setShowReadyForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // ── Variant selection ──

  const {
    pendingVariantItem,
    setPendingVariantItem,
    handleServiceSelect,
    handlePartSelect,
  } = useVariantSelection({
    orgId,
    addService,
    addPart,
  });

  const handleServiceDrawerOpenChange = useCallback(
    (open: boolean) => setShowAddService(open),
    [setShowAddService],
  );
  const handlePartDrawerOpenChange = useCallback(
    (open: boolean) => setShowAddPart(open),
    [setShowAddPart],
  );

  const isFirstRender = useRef(true);

  // Reset fullscreen when drawer closes
  useEffect(() => {
    if (!open) setIsFullScreen(false);
  }, [open]);

  // Handle initial action from bay card quick actions
  useEffect(() => {
    if (open && initialAction && wo) {
      if (initialAction === "add-service") {
        setShowAddService(true);
      } else if (initialAction === "add-part") {
        setShowAddPart(true);
      }
    }
  }, [open, initialAction, wo, setShowAddPart, setShowAddService]);

  // Show celebration + auto-close drawer after optimistic complete
  const prevStatusRef = useRef(wo?.status);
  useEffect(() => {
    if (prevStatusRef.current !== "Completed" && wo?.status === "Completed") {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = wo?.status;
  }, [wo?.status, onOpenChange]);

  // Scale animation: shrink → resize → expand
  useLayoutEffect(() => {
    void isFullScreen;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    requestAnimationFrame(() => setTransitioning(true));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(false);
      });
    });
  }, [isFullScreen]);

  // ── Handlers ──

  async function handleDirectComplete() {
    const orgIdVal = orgIdRef.current;
    if (!orgIdVal || !workOrderId) return;

    try {
      await completeMutation.mutateAsync({ status: "Completed" });
      await fetchWo(true);
      toast.dismiss();
      toast.success(t("workOrderCompleted"));
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 1500);
      onRefresh();
    } catch {
      toast.error(t("failedToComplete"));
    }
  }

  async function handleMarkReady() {
    if (workOrderId) {
      setShowReadyForm(true);
    }
  }

  async function handleReadyForPickupSubmit(data: {
    odometerReading: number | null;
    mechanicNotes: string;
    paymentMethod: string;
    transferBankId: string | null;
  }) {
    const orgIdVal = orgIdRef.current;
    if (!orgIdVal || !workOrderId || !wo?.vehicle_id) return;

    const prevWo = wo;

    setWo((prev) =>
      prev
        ? ({ ...prev, status: "Ready for Pickup" } as WorkOrderDetail)
        : prev,
    );
    setShowReadyForm(false);

    try {
      await savePostServiceData({
        workOrderId,
        vehicleId: wo.vehicle_id,
        odometerReading: data.odometerReading,
        recommendations: [],
        mechanicNotes: data.mechanicNotes,
      });

      await completeMutation.mutateAsync({
        status: "Ready for Pickup",
        notes: data.mechanicNotes || undefined,
      });

      if (orgIdVal && grandTotal > 0) {
        try {
          await createInvoiceAndRecordPayment(
            orgIdVal,
            workOrderId,
            data.paymentMethod,
            paymentMethodFees[
              data.paymentMethod as keyof typeof paymentMethodFees
            ] ?? 0,
            transferBanks,
            data.transferBankId,
          );
        } catch (err) {
          reportServerError("Unexpected error", err);
          toast.warning(
            err instanceof Error
              ? err.message
              : "Ready — but payment could not be recorded",
          );
        }
      }

      fetchWo(true);
      toast.dismiss();
      toast.success("Ready for Pickup");
      onRefresh();
    } catch {
      if (prevWo) setWo(prevWo);
      toast.error("Failed to save post-service data");
    }
  }

  const handleNuatToggle = useCallback(
    async (checked: boolean) => {
      setWo((prev) =>
        prev ? ({ ...prev, nuat_enabled: checked } as WorkOrderDetail) : prev,
      );

      try {
        await nuatMutation.mutateAsync({ nuat_enabled: checked });
        toast.success(checked ? "НӨАТ идэвхижүүлэв" : "НӨАТ идэвхигүй болгов");
      } catch {
        setWo((prev) =>
          prev
            ? ({ ...prev, nuat_enabled: !checked } as WorkOrderDetail)
            : prev,
        );
        toast.error("НӨАТ тохиргоо шинэчлэхэд алдаа гарлаа");
      }
    },
    [setWo, nuatMutation],
  );

  // ── Render ──

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={(nextOpen) => handleOpenChange(nextOpen)}
        className={cn(
          isFullScreen
            ? "!max-w-full !w-full"
            : "sm:max-w-[46rem] lg:max-w-[68rem] xl:max-w-[78rem]",
        )}
        backdropClassName={
          isFullScreen ? "bg-black/80 !backdrop-blur-none" : undefined
        }
        contentClassName={cn(
          isFullScreen
            ? "rounded-none border-0"
            : "border-border/80 shadow-2xl",
        )}
        viewportClassName={isFullScreen ? "p-0" : undefined}
      >
        <DrawerHeaderSection
          wo={wo}
          loading={isLoading && !wo}
          mechanics={mechanics}
          helpers={(wo?.helpers ?? []) as unknown as MechanicRef[]}
          orgId={orgId ?? ""}
          workOrderId={workOrderId ?? ""}
          saving={saving}
          isAddingService={isConfirming}
          isFullScreen={isFullScreen}
          onAssignMechanic={assignMechanic}
          onHelpersChange={() => {
            void fetchWo(true);
            onRefresh();
          }}
          onToggleFullScreen={() => setIsFullScreen((f) => !f)}
          onClose={() => handleOpenChange(false)}
          showBack={showPostServiceForm}
          onBack={handleCancelPostService}
          t={t}
        />
        {/* Customer — shown near top for visibility; skeleton while loading */}
        {wo ? (
          <div className="px-3 py-1.5 border-b border-border/60 flex items-center gap-2 text-xs">
            {wo.customer ? (
              <>
                <User className="size-3.5 text-muted-foreground/60 shrink-0" />
                <span className="font-medium text-foreground/80 truncate">
                  {[wo.customer.first_name, wo.customer.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                    wo.customer.phone ||
                    t("unknownCustomer")}
                </span>
                {wo.customer.phone &&
                  [wo.customer.first_name, wo.customer.last_name]
                    .filter(Boolean)
                    .join(" ") && (
                    <span className="text-muted-foreground/60 font-mono">
                      {wo.customer.phone}
                    </span>
                  )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="ml-auto shrink-0"
                  onClick={() => setShowCustomerPicker(true)}
                  aria-label="Change customer"
                >
                  <UserPlus className="size-3" />
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowCustomerPicker(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <UserPlus className="size-3.5" />
                {t("selectCustomer")}
              </button>
            )}
          </div>
        ) : (
          <div className="px-3 py-1.5 border-b border-border/60 flex items-center gap-2 text-xs">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        )}

        {/* Quick actions — visible once data is available */}
        {wo && orgId && workOrderId && (
          <WorkOrderQuickActions
            workOrderId={workOrderId}
            orgId={orgId}
            existingNotes={wo.notes}
            onNoteAdded={() => fetchWo(true)}
            t={t}
          />
        )}

        {/* Content — PPR pattern: always render structure, skeleton-load values */}
        <div
          className={cn(
            "flex flex-col min-h-0 flex-1 overflow-hidden transition-[transform,opacity] duration-300 ease-out",
            transitioning ? "scale-[0.98] opacity-95" : "scale-100 opacity-100",
          )}
        >
          {error?.message && !wo ? (
            <DrawerSkeleton
              loading={false}
              error={error.message}
              onRetry={() => fetchWo()}
            >
              {null}
            </DrawerSkeleton>
          ) : !wo ? (
            <DrawerSkeletonLayout />
          ) : (
            <DrawerContentPanel
              wo={wo}
              orgId={orgId ?? ""}
              workOrderId={workOrderId ?? ""}
              catalog={catalog}
              partsCatalog={partsCatalog}
              serviceSearch={serviceSearch}
              showAddService={showAddService}
              isFullScreen={isFullScreen}
              onServiceSearchChange={setServiceSearch}
              onAddServiceOpenChange={handleServiceDrawerOpenChange}
              onAddService={handleServiceSelect}
              onEditServicePriceSave={handleServicePriceSave}
              onEditServiceQtySave={handleServiceQtySave}
              partSearch={partSearch}
              showAddPart={showAddPart}
              onPartSearchChange={setPartSearch}
              onAddPartOpenChange={handlePartDrawerOpenChange}
              onAddPart={handlePartSelect}
              onEditPartPriceSave={handlePartPriceSave}
              onEditPartQtySave={handlePartQtySave}
              lastAddedServiceId={lastAddedServiceId}
              lastAddedPartId={lastAddedPartId}
              onNotesUpdated={() => fetchWo(true)}
              nuatEnabled={wo.nuat_enabled ?? false}
              onNuatToggle={handleNuatToggle}
              taxRate={orgSettings?.default_tax_rate ?? 0}
              saving={saving}
              confirmStatus={confirmStatus}
              statusNotes={statusNotes}
              creatingInvoice={creatingInvoice}
              canCancel={canCancel}
              canInvoice={canInvoice}
              invoicePublicToken={invoicePublicToken}
              onChangeStatus={changeStatus}
              onConfirmCancel={() => {
                setConfirmStatus(null);
                setStatusNotes("");
              }}
              onStatusNotesChange={setStatusNotes}
              onMarkReady={handleMarkReady}
              onComplete={handleDirectComplete}
              onCreateInvoice={generateInvoice}
            />
          )}
        </div>

        <UnsavedWarning
          show={showUnsavedWarning}
          onDiscard={handleDiscard}
          onKeepEditing={() => setShowUnsavedWarning(false)}
          onSaveAndClose={handleSaveAndClose}
        />

        <DrawerCelebration
          show={showCelebration}
          message={t("completedCelebration")}
        />

        {/* Nested drawers */}
        <DrawerNestedForms
          wo={wo}
          showReadyForm={showReadyForm}
          grandTotal={grandTotal}
          paymentMethodFees={paymentMethodFees}
          transferBanks={transferBanks}
          onReadyFormClose={() => setShowReadyForm(false)}
          onReadyForPickupSubmit={handleReadyForPickupSubmit}
        />
      </DetailDrawer>

      {/* Customer picker modal — outside parent drawer to avoid nested dialog focus conflicts */}
      {showCustomerPicker && orgId && (
        <CustomerPickerModal
          orgId={orgId}
          open={showCustomerPicker}
          onOpenChange={setShowCustomerPicker}
          onSelect={(customer) => {
            assignCustomer(customer.id);
          }}
        />
      )}

      {/* Variant selection dialog */}
      {pendingVariantItem && (
        <VariantSelectionDialog
          open={!!pendingVariantItem}
          onOpenChange={(_open: boolean) => {
            setPendingVariantItem(null);
          }}
          entityType={pendingVariantItem.entityType}
          entityId={pendingVariantItem.entityId}
          entityName={pendingVariantItem.entityName}
          defaultPrice={pendingVariantItem.defaultPrice}
          onConfirm={pendingVariantItem.onConfirm}
          onSkip={pendingVariantItem.onSkip}
        />
      )}
    </>
  );
}
