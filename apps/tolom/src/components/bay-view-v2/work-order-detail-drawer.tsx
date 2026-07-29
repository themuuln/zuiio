"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
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
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { bayViewKeys, workOrderKeys } from "@/lib/queries/keys";
import {
  type DrawerDetailResponse,
  drawerDetailKeys,
  useDrawerCatalogs,
  useDrawerQueries,
} from "@/lib/queries/use-drawer-queries";
import { reportServerError } from "@/lib/sentry-report-server";
import { savePostServiceData } from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";
import { CustomerPickerModal } from "./_customer-picker-modal";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerContentPanel } from "./_drawer-content-panel";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerSkeleton } from "./_drawer-loading";
import { DrawerNestedForms } from "./_drawer-nested-forms";
import { DrawerSkeletonLayout } from "./_drawer-skeleton-layout";
import type {
  CatalogPartItem,
  CatalogServiceItem,
  WorkOrderDetailDrawerProps,
} from "./_drawer-types";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { createInvoiceAndRecordPayment } from "./_payment-helpers";
import { useDrawerMutations } from "./_use-drawer-mutations";
import { useVariantSelection } from "./_use-variant-selection";

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
  const t = useTranslations("bayView") as (
    key: string,
    params?: Record<string, string | number | Date>,
  ) => string;

  const queryClient = useQueryClient();

  // ── Data layer ──

  const { orgId, orgIdRef, wo, setWo, isLoading, error } =
    useDrawerQueries(workOrderId);

  const { catalog, partsCatalog, mechanics, orgSettings } = useDrawerCatalogs(
    orgId,
    !!workOrderId && !!orgId,
  );

  const paymentMethodFees = useMemo(
    () => resolvePaymentMethodFees(orgSettings?.payment_method_fees),
    [orgSettings?.payment_method_fees],
  );
  const transferBanks = useMemo(
    () =>
      resolveOrgTransferBanks(
        normalizeOrgTransferBankAccounts(orgSettings?.transfer_bank_accounts),
      ),
    [orgSettings?.transfer_bank_accounts],
  );

  // PPR: render layout skeleton immediately, no spinner. Once data loads,
  // wo becomes non-null and the shell preserves on refetches.

  // fetchWo: refetch the work order detail query.
  // Before refetching, we snapshot any unconfirmed temp items (added via
  // addItem() but not yet persisted through confirmAdd()) so they survive
  // the server-response cache overwrite.
  const fetchWo = useCallback(
    async (silent = false) => {
      if (!orgId || !workOrderId) return;
      const key = drawerDetailKeys.all(orgId, workOrderId);

      // Snapshot temp items currently in the cache
      const prevData = queryClient.getQueryData<DrawerDetailResponse>(key);
      const tempServices =
        prevData?.workOrder?.services?.filter((s) =>
          String(s.id).startsWith("temp-"),
        ) ?? [];
      const tempParts =
        prevData?.workOrder?.parts?.filter((p) =>
          String(p.id).startsWith("temp-"),
        ) ?? [];
      const hasTempItems = tempServices.length > 0 || tempParts.length > 0;

      if (silent) {
        await queryClient.invalidateQueries({ queryKey: key });
      } else {
        await queryClient.refetchQueries({ queryKey: key });
      }

      // Merge temp items back into the fresh server data
      if (hasTempItems) {
        queryClient.setQueryData<DrawerDetailResponse>(key, (fresh) => {
          if (!fresh?.workOrder) return fresh;

          // Deduplicate: skip temp items whose real counterpart was
          // already confirmed during the refetch window
          const freshSvcIds = new Set(
            fresh.workOrder.services
              ?.map((s) => s.service_catalog_id)
              .filter(Boolean) ?? [],
          );
          const freshPartIds = new Set(
            fresh.workOrder.parts?.map((p) => p.part_id).filter(Boolean) ?? [],
          );
          const freshPartNames = new Set(
            fresh.workOrder.parts?.map((p) => p.part_name).filter(Boolean) ??
              [],
          );

          const survivingServices = tempServices.filter(
            (s) =>
              !s.service_catalog_id || !freshSvcIds.has(s.service_catalog_id),
          );
          const survivingParts = tempParts.filter(
            (p) =>
              (p.part_id ? !freshPartIds.has(p.part_id) : true) &&
              (p.part_name ? !freshPartNames.has(p.part_name) : true),
          );

          if (survivingServices.length === 0 && survivingParts.length === 0)
            return fresh;

          return {
            ...fresh,
            workOrder: {
              ...fresh.workOrder,
              services: [
                ...(fresh.workOrder.services ?? []),
                ...survivingServices,
              ],
              parts: [...(fresh.workOrder.parts ?? []), ...survivingParts],
            },
          };
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
  // ── Stable callbacks for sub-components ──
  const handleHelpersChange = useCallback(() => {
    void fetchWo(true);
    onRefresh();
  }, [fetchWo, onRefresh]);

  const handleToggleFullScreen = useCallback(
    () => setIsFullScreen((f) => !f),
    [],
  );

  const handleClose = useCallback(
    () => handleOpenChange(false),
    [handleOpenChange],
  );

  const handleShowCustomerPicker = useCallback(
    () => setShowCustomerPicker(true),
    [],
  );

  const handleNotesUpdated = useCallback(() => {
    void fetchWo(true);
  }, [fetchWo]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmStatus(null);
    setStatusNotes("");
  }, [setConfirmStatus, setStatusNotes]);

  const handleReadyFormClose = useCallback(() => setShowReadyForm(false), []);
  const handleKeepEditing = useCallback(
    () => setShowUnsavedWarning(false),
    [setShowUnsavedWarning],
  );

  const handleCustomerSelect = useCallback(
    (customer: { id: string }) => {
      assignCustomer(customer.id);
    },
    [assignCustomer],
  );

  const handleVariantDialogClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setPendingVariantItem(null);
      }
    },
    [setPendingVariantItem],
  );

  // ── Render ──

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={handleOpenChange}
        size="1/2"
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
          onHelpersChange={handleHelpersChange}
          onToggleFullScreen={handleToggleFullScreen}
          onClose={handleClose}
          showBack={showPostServiceForm}
          onBack={handleCancelPostService}
          onShowCustomerPicker={handleShowCustomerPicker}
          t={t}
        />

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
            <DrawerSkeletonLayout isFullScreen={isFullScreen} />
          ) : (
            <DrawerContentPanel
              wo={wo}
              orgId={orgId ?? ""}
              workOrderId={workOrderId ?? ""}
              catalog={catalog}
              partsCatalog={partsCatalog}
              isFullScreen={isFullScreen}
              onAddServiceOpenChange={handleServiceDrawerOpenChange}
              onEditServicePriceSave={handleServicePriceSave}
              onEditServiceQtySave={handleServiceQtySave}
              onAddPartOpenChange={handlePartDrawerOpenChange}
              onEditPartPriceSave={handlePartPriceSave}
              onEditPartQtySave={handlePartQtySave}
              lastAddedServiceId={lastAddedServiceId}
              lastAddedPartId={lastAddedPartId}
              onNotesUpdated={handleNotesUpdated}
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
              onConfirmCancel={handleConfirmCancel}
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
          onKeepEditing={handleKeepEditing}
          onSaveAndClose={handleSaveAndClose}
        />

        <DrawerCelebration
          show={showCelebration}
          message={t("completedCelebration")}
        />

        {/* Nested drawers — rendered outside DrawerContent (portaled) but inside
            DrawerPrimitive.Root via DetailDrawer's nestedContent slot.
            This is the canonical Base UI pattern for nested drawer detection:
            the child DrawerRoot's DialogRootContext finds the parent context
            through React tree, enabling proper --nested-drawers stacking vars. */}
        <CatalogPickerDrawer
          open={showAddService}
          onOpenChange={handleServiceDrawerOpenChange}
          title={t("services")}
          items={catalog}
          search={serviceSearch}
          onSearchChange={setServiceSearch}
          onSelect={handleServiceSelect}
          onAddNew={(name) =>
            handleServiceSelect({
              id: "",
              name,
              name_mn: null,
              default_price: 0,
              category: null,
              _source: "global",
            } as unknown as CatalogServiceItem)
          }
          isAdded={(svc) =>
            wo?.services?.some((s) => s.service_catalog_id === svc.id) ?? false
          }
          placeholder={t("searchServices")}
          noMatchMessage={t("noMatchService")}
          addAsNewLabel={t("addAsNew")}
          filterAllLabel={t("filterAll")}
        />
        <CatalogPickerDrawer
          open={showAddPart}
          onOpenChange={handlePartDrawerOpenChange}
          title={t("parts")}
          items={partsCatalog}
          search={partSearch}
          onSearchChange={setPartSearch}
          onSelect={handlePartSelect}
          onAddNew={(name) =>
            handlePartSelect({
              id: "",
              name,
              name_mn: null,
              default_price: 0,
              _source: "global",
            } as CatalogPartItem)
          }
          isAdded={(item) =>
            wo?.parts?.some((p) => p.part_id === item.id) ??
            wo?.parts?.some(
              (p) =>
                p.part_id === null &&
                p.part_name.toLowerCase() === item.name.toLowerCase(),
            ) ??
            false
          }
          placeholder={t("searchParts")}
          noMatchMessage={t("noMatchPart")}
          addAsNewLabel={t("addAsNew")}
          filterAllLabel={t("filterAll")}
        />
        <DrawerNestedForms
          wo={wo}
          showReadyForm={showReadyForm}
          grandTotal={grandTotal}
          paymentMethodFees={paymentMethodFees}
          transferBanks={transferBanks}
          onReadyFormClose={handleReadyFormClose}
          onReadyForPickupSubmit={handleReadyForPickupSubmit}
        />
      </DetailDrawer>

      {/* Customer picker modal — outside parent drawer to avoid nested dialog focus conflicts */}
      {showCustomerPicker && orgId && (
        <CustomerPickerModal
          orgId={orgId}
          open={showCustomerPicker}
          onOpenChange={setShowCustomerPicker}
          onSelect={handleCustomerSelect}
        />
      )}

      {/* Variant selection dialog */}
      {pendingVariantItem && (
        <VariantSelectionDialog
          open={!!pendingVariantItem}
          onOpenChange={handleVariantDialogClose}
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
