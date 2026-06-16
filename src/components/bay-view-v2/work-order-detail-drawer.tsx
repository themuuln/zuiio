"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { VariantSelection } from "@/components/services/variant-picker";
import { VariantSelectionDialog } from "@/components/services/variant-selection-dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";
import {
  normalizeOrgTransferBankAccounts,
  resolveOrgTransferBanks,
} from "@/lib/payments/org-bank-accounts";
import { workOrderKeys } from "@/lib/queries/keys";
import { useDrawerQueries } from "@/lib/queries/use-drawer-queries";
import { useOrgSettings } from "@/lib/queries/use-org-settings";
import {
  saveCompletionData,
  savePostServiceData,
} from "@/lib/services/post-service-service";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { cn } from "@/lib/utils";
import { CustomerPickerModal } from "./_customer-picker-modal";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerFooter } from "./_drawer-footer";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerLoading, DrawerSkeleton } from "./_drawer-loading";
import type {
  CatalogPartItem,
  CatalogServiceItem,
  WorkOrderDetailDrawerProps,
} from "./_drawer-types";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { createInvoiceAndRecordPayment } from "./_helpers";
import { NotesSection } from "./_notes-section";
import { PartsSection } from "./_parts-section";
import { resolvePaymentMethodFees } from "./_payment-fees";
import { QuickActions } from "./_quick-actions";
import { ReadyForPickupForm } from "./_ready-for-pickup-form";
import { ServicesSection } from "./_services-section";
import { StatusTimeline } from "./_status-timeline";
import { TotalsSummary } from "./_totals-summary";
import { useDrawerMutations } from "./_use-drawer-mutations";
import type { PickupCompleteData } from "./pickup-complete-form";
import { PickupCompleteForm } from "./pickup-complete-form";

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
  const locale = useLocale();

  const queryClient = useQueryClient();

  // ── Data layer (React Query) ──

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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  useEffect(() => {
    if (wo && !hasLoadedOnce) setHasLoadedOnce(true);
  }, [wo, hasLoadedOnce]);

  // fetchWo: refetch the work order detail query (called by mutations after writes)
  const fetchWo = useCallback(
    async (silent = false) => {
      if (!orgId || !workOrderId) return;
      if (silent) {
        // Background refetch — don't show loading spinner
        await queryClient.invalidateQueries({
          queryKey: workOrderKeys.detail(orgId, workOrderId),
        });
      } else {
        // Full refetch
        await queryClient.refetchQueries({
          queryKey: workOrderKeys.detail(orgId, workOrderId),
        });
      }
    },
    [orgId, workOrderId, queryClient],
  );

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
    removePart,
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

  // ── Local-only state ──

  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showReadyForm, setShowReadyForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Variant selection state
  const [pendingVariantItem, setPendingVariantItem] = useState<{
    entityType: "service" | "part";
    entityId: string;
    entityName: string;
    defaultPrice: number;
    onConfirm: (selection: VariantSelection | null) => void;
    onSkip: () => void;
  } | null>(null);

  const isFirstRender = useRef(true);

  // ── Variant-aware service/part selection handlers ──

  async function handleServiceSelect(svc: CatalogServiceItem) {
    if (svc.id && svc._source !== "global") {
      // Check if this service has variants
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/catalog-variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list-items",
              entity_type: "service",
              entity_id: svc.id,
            }),
          },
        );
        const json = await res.json();
        const items = json.data as Array<{ id: string }>;
        if (items.length > 0) {
          // Show variant picker
          setPendingVariantItem({
            entityType: "service",
            entityId: svc.id,
            entityName: svc.name,
            defaultPrice: Number(svc.last_price ?? svc.default_price ?? 0),
            onConfirm: (selection) => {
              if (selection) {
                const svcWithVariant = {
                  ...svc,
                  last_price: selection.price,
                  variant_id: selection.variantId,
                  variant_label: selection.label,
                } as CatalogServiceItem & {
                  variant_id?: string | null;
                  variant_label?: string;
                };
                addService(svcWithVariant);
              } else {
                addService(svc);
              }
            },
            onSkip: () => addService(svc),
          });
          return;
        }
      } catch {
        // If variant check fails, proceed as normal
      }
    }
    addService(svc);
  }

  async function handlePartSelect(part: CatalogPartItem) {
    if (part.id && part._source !== "global") {
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/catalog-variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "list-items",
              entity_type: "part",
              entity_id: part.id,
            }),
          },
        );
        const json = await res.json();
        const items = json.data as Array<{ id: string }>;
        if (items.length > 0) {
          setPendingVariantItem({
            entityType: "part",
            entityId: part.id,
            entityName: part.name,
            defaultPrice: Number(part.last_price ?? part.default_price ?? 0),
            onConfirm: (selection) => {
              if (selection) {
                const partWithVariant = {
                  ...part,
                  last_price: selection.price,
                  variant_id: selection.variantId,
                  variant_label: selection.label,
                } as CatalogPartItem & {
                  variant_id?: string | null;
                  variant_label?: string;
                };
                addPart(partWithVariant);
              } else {
                addPart(part);
              }
            },
            onSkip: () => addPart(part),
          });
          return;
        }
      } catch {
        // proceed as normal
      }
    }
    addPart(part);
  }

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
    // Phase 1: shrink (visible for one frame)
    requestAnimationFrame(() => setTransitioning(true));
    // Phase 2: apply size change, then expand
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitioning(false);
      });
    });
  }, [isFullScreen]);

  // ── Pickup complete ──

  async function handleCompleteSubmit(data: PickupCompleteData) {
    const orgIdVal = orgIdRef.current;
    if (!orgIdVal || !workOrderId || !wo?.vehicle_id) return;

    // Step 1: Persist completion data (idempotent — safe to retry)
    try {
      await saveCompletionData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: null,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToComplete"));
      return;
    }

    // Step 2: Update status to Completed — handled separately so a PATCH failure
    // doesn't lose the already-saved completion data.
    // saveCompletionData is idempotent, so retrying is safe.
    try {
      const res = await fetch(
        `/api/organizations/${orgIdVal}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        },
      );
      const json = await res.json();

      if (json.error) {
        toast.error(
          `${t("completionDataSaved")} ${json.error.message ?? t("failedToComplete")}`,
        );
        return;
      }

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
    } catch (err) {
      toast.error(
        `${t("completionDataSaved")} ${err instanceof Error ? err.message : t("failedToComplete")}`,
      );
    }
  }

  // ── Ready for Pickup (simplified) ──

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

    // Snapshot for rollback
    const prevWo = wo;

    // Optimistic: update status immediately, close form
    setWo((prev) =>
      prev
        ? ({ ...prev, status: "Ready for Pickup" } as WorkOrderDetail)
        : prev,
    );
    setShowReadyForm(false);

    // Run sequentially to avoid partial-success state:
    // savePostServiceData first, then PATCH status. If the PATCH fails after
    // post-service data was saved, we log a warning but don't revert the UI
    // (the data is already persisted and the UI transition is desirable).
    try {
      await savePostServiceData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: data.odometerReading,
        recommendations: [],
        mechanicNotes: data.mechanicNotes,
      });

      const statusJson = await fetch(
        `/api/organizations/${orgIdVal}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Ready for Pickup",
            notes: data.mechanicNotes || undefined,
          }),
        },
      ).then((r) => r.json());

      if (statusJson.error) {
        if (prevWo) setWo(prevWo);
        toast.error(statusJson.error.message ?? "Failed to update status");
        return;
      }

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

  // ── Compute totals ──

  const servicesTotal =
    wo?.services?.reduce((s, svc) => s + Number(svc.final_price), 0) ?? 0;
  const partsTotal =
    wo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ?? 0;
  const grandTotal = servicesTotal + partsTotal;
  const handleServiceDrawerOpenChange = (nextOpen: boolean) => {
    setShowAddService(nextOpen);
    if (!nextOpen) setServiceSearch("");
  };
  const handlePartDrawerOpenChange = (nextOpen: boolean) => {
    setShowAddPart(nextOpen);
    if (!nextOpen) setPartSearch("");
  };

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
            onHelpersChange={() => fetchWo(true)}
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
            <QuickActions
              workOrderId={workOrderId}
              orgId={orgId}
              existingNotes={wo.notes}
              onNoteAdded={() => fetchWo(true)}
              t={t}
            />
          )}

          {/* Content — always rendered after first load (skeleton when refetching) */}
          {hasLoadedOnce && (
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
                {wo ? (
                  <>
                    <div className="relative flex-1 overflow-y-auto min-h-0">
                      <VehicleMakeLogo
                        make={wo.vehicle?.make}
                        size="70%"
                        className="absolute inset-0 m-auto pointer-events-none select-none text-primary/[0.03]"
                        aria-hidden
                      />
                      <div className="relative px-3 py-2">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div className="lg:col-span-2">
                            <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto">
                              <ServicesSection
                                services={wo.services ?? []}
                                catalog={catalog}
                                serviceSearch={serviceSearch}
                                showAddService={showAddService}
                                locale={locale}
                                onServiceSearchChange={setServiceSearch}
                                onAddServiceOpenChange={
                                  handleServiceDrawerOpenChange
                                }
                                onAddService={handleServiceSelect}
                                onRemoveService={removeService}
                                onEditPriceSave={handleServicePriceSave}
                                onEditQtySave={handleServiceQtySave}
                                t={t}
                              />

                              <PartsSection
                                parts={wo.parts ?? []}
                                partsCatalog={partsCatalog}
                                lowStockMap={lowStockMap}
                                partSearch={partSearch}
                                showAddPart={showAddPart}
                                locale={locale}
                                onPartSearchChange={setPartSearch}
                                onAddPartOpenChange={handlePartDrawerOpenChange}
                                onAddPart={handlePartSelect}
                                onRemovePart={removePart}
                                onEditPriceSave={handlePartPriceSave}
                                onEditQtySave={handlePartQtySave}
                                t={t}
                              />

                              {orgId && workOrderId ? (
                                <NotesSection
                                  complaint={wo.complaint}
                                  diagnosis={wo.diagnosis}
                                  notes={wo.notes}
                                  orgId={orgId}
                                  workOrderId={workOrderId}
                                  onUpdated={() => fetchWo(true)}
                                  t={t}
                                />
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:sticky lg:top-3 self-start">
                            <StatusTimeline
                              statusHistory={wo.status_history ?? []}
                              serviceHistory={wo.service_history ?? []}
                              t={t}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* НӨАТ + Totals — floating above drawer footer (same width as lg:col-span-2) */}
                    <div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-2 flex flex-col gap-3 shrink-0">
                          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                            <div className="flex flex-col">
                              <Label className="text-xs font-medium">
                                {orgSettings?.language === "en"
                                  ? "VAT"
                                  : "НӨАТ"}
                              </Label>
                              <span className="text-[10px] text-muted-foreground">
                                {orgSettings?.language === "en"
                                  ? "Value Added Tax"
                                  : "Нэмэгдсэн Өртөгт Татвар"}
                              </span>
                            </div>
                            <Switch
                              checked={
                                ((wo as Record<string, unknown>)
                                  .nuat_enabled as boolean) ?? false
                              }
                              onCheckedChange={async (checked) => {
                                // Optimistic update immediately
                                setWo((prev) =>
                                  prev
                                    ? ({
                                        ...prev,
                                        nuat_enabled: checked,
                                      } as WorkOrderDetail)
                                    : prev,
                                );

                                try {
                                  const res = await fetch(
                                    `/api/organizations/${orgId}/work-orders/${workOrderId}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        nuat_enabled: checked,
                                      }),
                                    },
                                  );
                                  if (!res.ok)
                                    throw new Error("Failed to update");
                                  toast.success(
                                    checked
                                      ? "НӨАТ идэвхижүүлэв"
                                      : "НӨАТ идэвхигүй болгов",
                                  );
                                } catch {
                                  // Rollback on error
                                  setWo((prev) =>
                                    prev
                                      ? ({
                                          ...prev,
                                          nuat_enabled: !checked,
                                        } as WorkOrderDetail)
                                      : prev,
                                  );
                                  toast.error(
                                    "НӨАТ тохиргоо шинэчлэхэд алдаа гарлаа",
                                  );
                                }
                              }}
                            />
                          </div>
                          <TotalsSummary
                            servicesTotal={servicesTotal}
                            partsTotal={partsTotal}
                            grandTotal={grandTotal}
                            discountTotal={wo.discount_total ?? 0}
                            taxRate={orgSettings?.default_tax_rate ?? 0}
                            nuatEnabled={
                              ((wo as Record<string, unknown>)
                                .nuat_enabled as boolean) ?? false
                            }
                            locale={(orgSettings?.language as string) ?? "mn"}
                            t={t}
                          />
                        </div>
                      </div>
                    </div>

                    <DrawerFooter
                      wo={wo}
                      grandTotal={grandTotal}
                      invoicePublicToken={invoicePublicToken}
                      saving={saving}
                      confirmStatus={confirmStatus}
                      statusNotes={statusNotes}
                      creatingInvoice={creatingInvoice}
                      canCancel={canCancel}
                      canInvoice={canInvoice}
                      onChangeStatus={changeStatus}
                      onConfirmCancel={() => {
                        setConfirmStatus(null);
                        setStatusNotes("");
                      }}
                      onStatusNotesChange={setStatusNotes}
                      onMarkReady={handleMarkReady}
                      onComplete={() => setShowCompleteForm(true)}
                      onCreateInvoice={generateInvoice}
                      t={t}
                    />
                  </>
                ) : null}
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
        </DrawerContent>

        {/* Nested drawer for Ready for Pickup form */}
        {wo && (
          <Drawer
            open={showReadyForm}
            onOpenChange={(next) => {
              if (!next) setShowReadyForm(false);
            }}
            swipeDirection="right"
          >
            <DrawerContent
              showCloseButton={false}
              className="sm:max-w-md"
              contentClassName="flex flex-col gap-0 border-border/80 shadow-2xl"
            >
              <ReadyForPickupForm
                vehiclePlate={
                  (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
                }
                currentOdometer={
                  (wo.vehicle as { odometer?: number | null })?.odometer ?? null
                }
                grandTotal={grandTotal}
                paymentMethodFees={paymentMethodFees}
                transferBanks={transferBanks}
                onConfirm={handleReadyForPickupSubmit}
                onBack={() => setShowReadyForm(false)}
              />
            </DrawerContent>
          </Drawer>
        )}

        {/* Nested drawer for Complete form */}
        {wo && (
          <Drawer
            open={showCompleteForm}
            onOpenChange={(next) => {
              if (!next) setShowCompleteForm(false);
            }}
            swipeDirection="right"
          >
            <DrawerContent
              showCloseButton={false}
              className="sm:max-w-md"
              contentClassName="flex flex-col gap-0 border-border/80 shadow-2xl"
            >
              <PickupCompleteForm
                vehiclePlate={
                  (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
                }
                onConfirm={handleCompleteSubmit}
                onBack={() => setShowCompleteForm(false)}
              />
            </DrawerContent>
          </Drawer>
        )}
      </Drawer>

      {/* Customer picker modal — rendered outside the parent drawer to avoid nested dialog focus conflicts */}
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

      {/* Variant Selection Dialog */}
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
