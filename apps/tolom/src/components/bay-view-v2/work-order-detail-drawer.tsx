"use client";

import { useQueryClient } from "@tanstack/react-query";
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
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { workOrderKeys } from "@/lib/queries/keys";
import { useOrgMutation } from "@zuiio/query";
import { bayViewKeys } from "@/lib/queries/keys";
import { useDrawerQueries } from "@/lib/queries/use-drawer-queries";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import {
  saveCompletionData,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { CustomerPickerModal } from "./_customer-picker-modal";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerLoading, DrawerSkeleton } from "./_drawer-loading";
import type { WorkOrderDetailDrawerProps } from "./_drawer-types";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { createInvoiceAndRecordPayment } from "./_helpers";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { useDrawerMutations } from "./_use-drawer-mutations";
import { useVariantSelection } from "./_use-variant-selection";
import { DrawerContentPanel } from "./_drawer-content-panel";
import { DrawerNestedForms } from "./_drawer-nested-forms";
import type { PickupCompleteData } from "./pickup-complete-form";

const WorkOrderQuickActions = dynamic(
  () =>
    import("./_work-order-quick-actions").then((m) => m.WorkOrderQuickActions),
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
    lowStockMap,
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

  // Track first successful load for layout-preserving skeleton
  // Delay by 320ms to let the drawer slide-in animation finish before
  // inserting the full content tree (avoids layout thrash mid-transition)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (wo && !hasLoadedOnce) {
      const timer = setTimeout(() => setHasLoadedOnce(true), 320);
      return () => clearTimeout(timer);
    }
  }, [wo, hasLoadedOnce]);

  // fetchWo: refetch the work order detail query
  const fetchWo = useCallback(
    async (silent = false) => {
      if (!orgId || !workOrderId) return;
      if (silent) {
        await queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId, workOrderId),
        });
      } else {
        await queryClient.refetchQueries({
          queryKey: workOrderKeys.detail(orgId, workOrderId),
        });
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
    removeService,
    handleServicePriceSave,
    handleServiceQtySave,
    handleServiceDiscountSave,
    removePart,
    handlePartPriceSave,
    handlePartQtySave,
    handlePartDiscountSave,
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
  const [showCompleteForm, setShowCompleteForm] = useState(false);
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
    if (open && initialAction && hasLoadedOnce) {
      if (initialAction === "add-service") {
        setShowAddService(true);
      } else if (initialAction === "add-part") {
        setShowAddPart(true);
      }
    }
  }, [open, initialAction, hasLoadedOnce, setShowAddPart, setShowAddService]);

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

  async function handleCompleteSubmit(data: PickupCompleteData) {
    const orgIdVal = orgIdRef.current;
    if (!orgIdVal || !workOrderId || !wo?.vehicle_id) return;

    try {
      await saveCompletionData({
        workOrderId,
        vehicleId: wo.vehicle_id,
        odometerReading: null,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToComplete"));
      return;
    }

    try {
      await completeMutation.mutateAsync({ status: "Completed" });
      await fetchWo(true);
      toast.dismiss();
      toast.success(t("workOrderCompleted"));
      setShowCompleteForm(false);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 1500);
      onRefresh();
    } catch {
      toast.error(`${t("completionDataSaved")} ${t("failedToComplete")}`);
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
      <Drawer
        open={open}
        onOpenChange={(nextOpen) => handleOpenChange(nextOpen)}
        swipeDirection="right"
      >
        <DrawerContent
          showCloseButton={false}
          className={cn(
            isFullScreen
              ? "max-w-full"
              : "sm:max-w-[46rem] lg:max-w-[68rem] xl:max-w-[78rem]",
          )}
          contentClassName={cn(
            "flex flex-col gap-0 border-border/80 shadow-2xl",
            isFullScreen ? "rounded-none border-0" : undefined,
          )}
          viewportClassName={isFullScreen ? "p-0" : undefined}
        >
          <DrawerHeaderSection
            wo={wo}
            loading={isLoading && !hasLoadedOnce}
            mechanics={mechanics}
            helpers={wo?.helpers ?? []}
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
            setShowCustomerPicker={setShowCustomerPicker}
            onBack={handleCancelPostService}
            t={t}
          />

          <DrawerLoading
            loading={isLoading && !hasLoadedOnce}
            hasLoadedOnce={hasLoadedOnce}
            error={error?.message ?? null}
            onRetry={() => fetchWo()}
          />

          {/* Quick actions — always visible after first load */}
          {hasLoadedOnce && wo && orgId && workOrderId && (
            <WorkOrderQuickActions
              workOrderId={workOrderId}
              orgId={orgId}
              existingNotes={wo.notes}
              onNoteAdded={() => fetchWo(true)}
              t={t}
            />
          )}

          {/* Content — always rendered after first load */}
          {hasLoadedOnce && wo && (
            <div
              className={cn(
                "flex flex-col min-h-0 flex-1 overflow-hidden transition-all duration-300 ease-out",
                transitioning
                  ? "scale-[0.98] opacity-95"
                  : "scale-100 opacity-100",
              )}
            >
              <DrawerSkeleton
                loading={isLoading}
                error={error?.message ?? null}
                onRetry={() => fetchWo()}
              >
                <DrawerContentPanel
                  wo={wo}
                  orgId={orgId ?? ""}
                  workOrderId={workOrderId ?? ""}
                  catalog={catalog}
                  partsCatalog={partsCatalog}
                  lowStockMap={lowStockMap}
                  serviceSearch={serviceSearch}
                  showAddService={showAddService}
                  onServiceSearchChange={setServiceSearch}
                  onAddServiceOpenChange={handleServiceDrawerOpenChange}
                  onAddService={handleServiceSelect}
                  onRemoveService={removeService}
                  onEditServicePriceSave={handleServicePriceSave}
                  onEditServiceQtySave={handleServiceQtySave}
                  onEditServiceDiscountSave={handleServiceDiscountSave}
                  partSearch={partSearch}
                  showAddPart={showAddPart}
                  onPartSearchChange={setPartSearch}
                  onAddPartOpenChange={handlePartDrawerOpenChange}
                  onAddPart={handlePartSelect}
                  onRemovePart={removePart}
                  onEditPartPriceSave={handlePartPriceSave}
                  onEditPartQtySave={handlePartQtySave}
                  onEditPartDiscountSave={handlePartDiscountSave}
                  onNotesUpdated={() => fetchWo(true)}
                  nuatEnabled={
                    ((wo as Record<string, unknown>).nuat_enabled as boolean) ??
                    false
                  }
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
                  onComplete={() => setShowCompleteForm(true)}
                  onCreateInvoice={generateInvoice}
                />
              </DrawerSkeleton>
            </div>
          )}

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
            showCompleteForm={showCompleteForm}
            grandTotal={grandTotal}
            paymentMethodFees={paymentMethodFees}
            transferBanks={transferBanks}
            onReadyFormClose={() => setShowReadyForm(false)}
            onCompleteFormClose={() => setShowCompleteForm(false)}
            onReadyForPickupSubmit={handleReadyForPickupSubmit}
            onCompleteSubmit={handleCompleteSubmit}
          />
        </DrawerContent>
      </Drawer>

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
