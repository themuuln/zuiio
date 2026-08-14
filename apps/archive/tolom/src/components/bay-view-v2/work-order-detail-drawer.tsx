"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import {
  ArrowLeft,
  Clock,
  Fingerprint,
  Gauge,
  Hash,
  MapPin,
  Maximize2,
  Minimize2,
  User,
  Wrench,
  X,
} from "lucide-react";
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
import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { MongolianLicensePlate } from "@/components/vehicles/license-plate";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
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
import type { Customer } from "@/lib/types";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import { cn } from "@/lib/utils";
import { CatalogPickerDrawer } from "./_catalog-picker-drawer";
import { CustomerPickerDrawer } from "./_customer-picker-drawer";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerFooter } from "./_drawer-footer";
import { DrawerSkeleton } from "./_drawer-loading";
import { DrawerNestedForms } from "./_drawer-nested-forms";
import type {
  CatalogPartItem,
  CatalogServiceItem,
  WorkOrderDetailDrawerProps,
} from "./_drawer-types";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { createInvoiceAndRecordPayment } from "./_payment-helpers";
import { StatusPill } from "./_status-pill";
import { useDrawerMutations } from "./_use-drawer-mutations";
import { useVariantSelection } from "./_use-variant-selection";
import {
  NotesSectionV2,
  PartsSectionV2,
  ServicesSectionV2,
} from "./drawer-v2/_sections";
import {
  CustomerCardV2,
  MechanicCardV2,
  TimelineCardV2,
} from "./drawer-v2/_sidebar";

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
  addHelperMutation: drawerAddHelperMutation,
  removeHelperMutation: drawerRemoveHelperMutation,
}: WorkOrderDetailDrawerProps) {
  const t = useTranslations("bayView") as (
    key: string,
    params?: Record<string, string | number | Date>,
  ) => string;

  const queryClient = useQueryClient();

  // ── Data layer ──

  const { orgId, orgIdRef, wo, setWo, error } = useDrawerQueries(workOrderId);

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

  const noteFieldMutation = useOrgMutation<
    unknown,
    Record<string, string | null>
  >({
    endpoint: () =>
      `/api/organizations/${orgIdRef.current}/work-orders/${workOrderId}`,
    method: "PATCH",
    queryKey: workOrderKeys.all(orgId ?? ""),
    optimisticQueryKey:
      orgId && workOrderId
        ? drawerDetailKeys.all(orgId, workOrderId)
        : undefined,
    onOptimisticUpdate: (
      qc: QueryClient,
      vars: Record<string, string | null>,
    ) => {
      if (!orgId || !workOrderId) return undefined;
      const key = drawerDetailKeys.all(orgId, workOrderId);
      const prev = qc.getQueryData<DrawerDetailResponse>(key);
      if (prev?.workOrder) {
        qc.setQueryData<DrawerDetailResponse>(key, {
          ...prev,
          workOrder: {
            ...prev.workOrder,
            ...vars,
          } as WorkOrderDetail,
        });
      }
      return prev;
    },
    invalidateKeys: branchFilter
      ? ([bayViewKeys.data(branchFilter)] as const)
      : undefined,
  });

  const handleSaveNoteField = useCallback(
    async (field: "complaint" | "diagnosis" | "notes", value: string) => {
      const prevWo = wo;
      try {
        await noteFieldMutation.mutateAsync({ [field]: value.trim() || null });
        void fetchWo(true);
        toast.success(t("saved"));
      } catch {
        // Rollback the optimistic cache patch (useOrgMutation does not
        // auto-rollback when onOptimisticUpdate is set).
        if (prevWo) setWo(prevWo);
        toast.error(t("failedToSave"));
      }
    },
    [noteFieldMutation, fetchWo, setWo, wo, t],
  );

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
    (customer: Customer) => {
      assignCustomer(
        customer.id,
        [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
          customer.phone ||
          null,
        customer,
      );
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

  // ── Derived display values ──

  const vehicle = wo?.vehicle;
  const customerName = wo?.customer
    ? [wo.customer.first_name, wo.customer.last_name]
        .filter(Boolean)
        .join(" ") ||
      wo.customer.full_name ||
      wo.customer.phone ||
      t("listHeaderCustomer")
    : t("listHeaderCustomer");
  const mechanicName = wo?.mechanic?.full_name ?? "—";
  const createdLabel = wo?.created_at
    ? new Date(wo.created_at).toLocaleDateString()
    : "";

  // ── Render ──

  return (
    <>
      <DetailDrawer
        open={open}
        onOpenChange={handleOpenChange}
        size={isFullScreen ? "full" : "detail"}
        backdropClassName={
          isFullScreen ? "bg-black/80 !backdrop-blur-none" : undefined
        }
        contentClassName={cn(
          isFullScreen ? "rounded-none border-0" : "shadow-2xl",
        )}
        viewportClassName={isFullScreen ? "p-0" : undefined}
      >
        <DrawerTitle className="sr-only">
          {t("workOrder")} —{" "}
          {vehicle?.plate_number ?? workOrderId?.slice(0, 8) ?? ""}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("workOrderDrawerDescription")}
        </DrawerDescription>

        {/* ── Header ─────────────────────────────────────── */}
        <header
          className={cn(
            "shrink-0 border-b border-border/70 bg-card",
            isFullScreen && "mx-auto w-full max-w-6xl",
          )}
        >
          <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              {showPostServiceForm && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancelPostService}
                  aria-label={t("backLabel")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                {!wo ? (
                  <div className="size-10 animate-pulse rounded-lg bg-muted" />
                ) : (
                  <VehicleMakeLogo
                    make={vehicle?.make}
                    size={20}
                    className="text-primary"
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {vehicle?.plate_number ? (
                    <MongolianLicensePlate plate={vehicle.plate_number} />
                  ) : !wo ? (
                    <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                  ) : (
                    <span className="text-sm font-semibold">
                      {t("workOrder")}
                    </span>
                  )}
                  {wo?.status && <StatusPill status={wo.status} />}
                </div>
                <p className="mt-1 truncate text-xs font-medium text-foreground/85">
                  {vehicle
                    ? [
                        `${vehicle.make} ${vehicle.model}`,
                        vehicle.year,
                        vehicle.color,
                        vehicle.fuel_type
                          ? `${t("fuel")}: ${vehicle.fuel_type}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : t("workOrder")}
                  {wo?.id && (
                    <>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="font-mono font-normal text-muted-foreground">
                        WO#{wo.id.slice(0, 8)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {!showPostServiceForm && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleToggleFullScreen}
                  aria-label={
                    isFullScreen ? t("exitFullscreen") : t("fullscreen")
                  }
                >
                  {isFullScreen ? (
                    <Minimize2 className="size-4" />
                  ) : (
                    <Maximize2 className="size-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                aria-label={t("close")}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Meta chips */}
          {wo && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/50 bg-muted/25 px-4 py-2 text-xs text-muted-foreground/80 sm:px-5">
              <span className="flex items-center gap-1.5">
                <Hash className="size-3.5 text-muted-foreground/50" />
                <span className="font-mono tabular-nums">
                  #{wo.id.slice(0, 8)}
                </span>
              </span>
              {wo.bay_number != null && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground/50" />
                  {t("bay")} {wo.bay_number}
                </span>
              )}
              {vehicle?.vin && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Fingerprint className="size-3.5 shrink-0 text-muted-foreground/50" />
                  <span className="font-mono tabular-nums">{vehicle.vin}</span>
                </span>
              )}
              {(wo.odometer_at_service ?? vehicle?.odometer) != null && (
                <span className="flex items-center gap-1.5">
                  <Gauge className="size-3.5 text-muted-foreground/50" />
                  {(
                    wo.odometer_at_service ??
                    vehicle?.odometer ??
                    0
                  ).toLocaleString()}{" "}
                  {t("km")}
                </span>
              )}
              <span className="flex min-w-0 items-center gap-1.5">
                <User className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="truncate">{customerName}</span>
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <Wrench className="size-3.5 shrink-0 text-muted-foreground/50" />
                <span className="truncate">{mechanicName}</span>
              </span>
              {createdLabel && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground/50" />
                  {t("created")} {createdLabel}
                </span>
              )}
            </div>
          )}
        </header>

        {/* ── Content ─────────────────────────────────────── */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden contain-layout contain-paint transition-[transform,opacity] duration-300 ease-out",
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
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className={cn(
                  "mx-auto w-full px-4 py-4 sm:px-5",
                  isFullScreen && "max-w-6xl",
                )}
              >
                <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="h-24 animate-pulse rounded-xl bg-muted/10" />
                    <div className="h-24 animate-pulse rounded-xl bg-muted/10" />
                    <div className="h-16 animate-pulse rounded-xl bg-muted/10" />
                  </div>
                  <div className="hidden gap-4 lg:flex lg:flex-col">
                    <div className="h-28 animate-pulse rounded-xl bg-muted/10" />
                    <div className="h-36 animate-pulse rounded-xl bg-muted/10" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div
                  className={cn(
                    "mx-auto w-full px-4 py-4 sm:px-5",
                    isFullScreen && "max-w-6xl",
                  )}
                >
                  {/* Vehicle identity lives in the header — no hero card */}
                  <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
                    <main className="flex min-w-0 flex-col gap-4">
                      <ServicesSectionV2
                        services={wo.services ?? []}
                        t={t}
                        onAddServiceOpenChange={handleServiceDrawerOpenChange}
                        onEditServiceQty={handleServiceQtySave}
                        onEditServicePrice={handleServicePriceSave}
                      />
                      <PartsSectionV2
                        parts={wo.parts ?? []}
                        t={t}
                        onAddPartOpenChange={handlePartDrawerOpenChange}
                        onEditPartQty={handlePartQtySave}
                        onEditPartPrice={handlePartPriceSave}
                      />
                      {orgId && workOrderId && (
                        <NotesSectionV2
                          complaint={wo.complaint}
                          diagnosis={wo.diagnosis}
                          notes={wo.notes}
                          t={t}
                          onSaveNoteField={handleSaveNoteField}
                        />
                      )}
                    </main>

                    <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
                      <CustomerCardV2
                        wo={wo}
                        t={t}
                        onOpenCustomerPicker={handleShowCustomerPicker}
                      />
                      <MechanicCardV2
                        wo={wo}
                        allMechanics={mechanics}
                        helpers={(wo.helpers ?? []) as unknown as MechanicRef[]}
                        workOrderId={workOrderId ?? ""}
                        t={t}
                        onAssignMechanic={assignMechanic}
                        addHelperMutation={drawerAddHelperMutation}
                        removeHelperMutation={drawerRemoveHelperMutation}
                      />
                      <TimelineCardV2 wo={wo} t={t} />
                    </aside>
                  </div>
                </div>
              </div>

              <DrawerFooter
                wo={wo}
                taxRate={orgSettings?.default_tax_rate ?? 0}
                nuatEnabled={wo.nuat_enabled ?? false}
                onNuatToggle={handleNuatToggle}
                invoicePublicToken={invoicePublicToken}
                saving={saving}
                confirmStatus={confirmStatus}
                statusNotes={statusNotes}
                creatingInvoice={creatingInvoice}
                canCancel={canCancel}
                canInvoice={canInvoice}
                onChangeStatus={changeStatus}
                onConfirmCancel={handleConfirmCancel}
                onStatusNotesChange={setStatusNotes}
                onMarkReady={handleMarkReady}
                onComplete={handleDirectComplete}
                onCreateInvoice={generateInvoice}
                t={t}
              />
            </>
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
            DrawerPrimitive.Root via DetailDrawer's children. This is the
            canonical Base UI pattern for nested drawer detection: the child
            DrawerRoot's DialogRootContext finds the parent context through the
            React tree, enabling proper --nested-drawers stacking vars. */}
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
            } as unknown as CatalogPartItem)
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

        {/* Customer picker drawer — nested inside parent DrawerRoot */}
        <CustomerPickerDrawer
          orgId={orgId ?? ""}
          open={showCustomerPicker}
          onOpenChange={setShowCustomerPicker}
          onSelect={handleCustomerSelect}
        />
      </DetailDrawer>

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
