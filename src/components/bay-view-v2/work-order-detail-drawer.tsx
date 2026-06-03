"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useRouter } from "@/lib/i18n/navigation";
import { saveCompletionData } from "@/lib/services/post-service-service";
import type { WorkOrderDetailDrawerProps } from "./_drawer-types";
import { useDrawerData } from "./_use-drawer-data";
import { useDrawerMutations } from "./_use-drawer-mutations";
import { DrawerCelebration } from "./_drawer-celebration";
import { DrawerFooter } from "./_drawer-footer";
import { DrawerHeaderSection } from "./_drawer-header";
import { DrawerLoading, DrawerSkeleton } from "./_drawer-loading";
import { UnsavedWarning } from "./_drawer-unsaved-warning";
import { NotesSection } from "./_notes-section";
import { PartsSection } from "./_parts-section";
import { ServicesSection } from "./_services-section";
import { StatusTimeline } from "./_status-timeline";
import { TotalsSummary } from "./_totals-summary";
import type { PickupCompleteData } from "./pickup-complete-form";
import { PickupCompleteForm } from "./pickup-complete-form";
import { PostServiceForm } from "./post-service-form";

// ── Drawer ───────────────────────────────────────────────────

export function WorkOrderDetailDrawer({
  workOrderId,
  open,
  onOpenChange,
  onRefresh,
}: WorkOrderDetailDrawerProps) {
  const t = useTranslations("bayView");
  const { push } = useRouter();

  // ── Data layer ──

  const {
    wo,
    setWo,
    loading,
    error,
    hasLoadedOnce,
    orgIdRef,
    fetchWo,
    catalog,
    partsCatalog,
    lowStockMap,
    mechanics,
  } = useDrawerData(workOrderId, open);

  // ── Mutations layer ──

  const {
    saving,
    serviceSearch,
    setServiceSearch,
    showAddService,
    setShowAddService,
    addingServiceId,
    pendingServicePreview,
    editingServicePriceId,
    setEditingServicePriceId,
    editingServicePriceVal,
    setEditingServicePriceVal,
    newPartName,
    setNewPartName,
    newPartQty,
    setNewPartQty,
    newPartPrice,
    setNewPartPrice,
    showAddPart,
    setShowAddPart,
    addingPart,
    pendingPartPreview,
    partSearch,
    setPartSearch,
    editingPartPriceId,
    setEditingPartPriceId,
    editingPartPriceVal,
    setEditingPartPriceVal,
    confirmStatus,
    setConfirmStatus,
    statusNotes,
    setStatusNotes,
    creatingInvoice,
    showPostServiceForm,
    postFormServices,
    showUnsavedWarning,
    setShowUnsavedWarning,
    addService,
    removeService,
    handleServicePriceSave,
    addPartLine,
    removePart,
    handlePartPriceSave,
    assignMechanic,
    changeStatus,
    generateInvoice,
    handleReadyForPickup,
    handlePostServiceFormSubmit,
    handleCancelPostService,
    handleOpenChange,
    handleSaveAndClose,
    handleDiscard,
    canCancel,
    canInvoice,
  } = useDrawerMutations({
    workOrderId,
    orgIdRef,
    wo,
    setWo,
    fetchWo,
    onRefresh,
    push,
    onOpenChange,
  });

  // ── Local-only state ──

  const [showPickupForm, setShowPickupForm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const handleCancelPickup = () => setShowPickupForm(false);

  // ── Pickup complete ──

  async function handlePickupSubmit(data: PickupCompleteData) {
    const orgId = orgIdRef.current;
    if (!orgId || !workOrderId || !wo?.vehicle_id) return;

    try {
      await saveCompletionData({
        workOrderId,
        vehicleId: wo.vehicle_id as string,
        odometerReading: null,
        customerSatisfaction: data.customerSatisfaction,
        customerFeedback: data.customerFeedback,
        nextAppointmentDate: data.nextAppointmentDate,
      });

      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Completed" }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to complete");
      } else {
        await fetchWo(true);
        toast.success("Work order completed");
        setShowPickupForm(false);
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          onOpenChange(false);
        }, 1500);
        onRefresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete work order",
      );
    }
  }

  // ── Compute totals ──

  const servicesTotal =
    wo?.services?.reduce((s, svc) => s + Number(svc.final_price), 0) ?? 0;
  const partsTotal =
    wo?.parts?.reduce((s, p) => s + Number(p.final_price), 0) ?? 0;

  // ── Render ──

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="flex max-h-[90vh] md:max-h-[85vh] w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-col gap-0 p-0 mx-auto md:bottom-4 md:rounded-xl md:border border-border/80 shadow-2xl">
        <DrawerHeaderSection
          wo={wo}
          loading={loading}
          mechanics={mechanics}
          saving={saving}
          onAssignMechanic={assignMechanic}
          onClose={() => handleOpenChange(false)}
          t={t}
        />

        <DrawerLoading
          loading={loading}
          hasLoadedOnce={hasLoadedOnce}
          error={error}
          onRetry={() => fetchWo()}
        />

        {/* Content — always rendered after first load (skeleton when refetching) */}
        {hasLoadedOnce && (
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <DrawerSkeleton
              loading={loading}
              error={error}
              onRetry={() => fetchWo()}
            >
              {wo ? (
                <>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="px-3 py-2">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        <div className="lg:col-span-2">
                          <div className="flex flex-col gap-3">
                            <ServicesSection
                              services={wo.services ?? []}
                              catalog={catalog as any}
                              serviceSearch={serviceSearch}
                              showAddService={showAddService}
                              addingServiceId={addingServiceId}
                              pendingServicePreview={pendingServicePreview}
                              editingPriceId={editingServicePriceId}
                              editingPriceVal={editingServicePriceVal}
                              onServiceSearchChange={setServiceSearch}
                              onToggleAddService={() =>
                                setShowAddService(!showAddService)
                              }
                              onAddService={addService as any}
                              onRemoveService={removeService}
                              onEditPriceStart={(id, val) => {
                                setEditingServicePriceId(id);
                                setEditingServicePriceVal(val);
                              }}
                              onEditPriceChange={setEditingServicePriceVal}
                              onEditPriceSave={handleServicePriceSave}
                              onEditPriceCancel={() =>
                                setEditingServicePriceId(null)
                              }
                              t={t}
                            />

                            <PartsSection
                              parts={wo.parts ?? []}
                              partsCatalog={partsCatalog as any}
                              lowStockMap={lowStockMap}
                              partSearch={partSearch}
                              newPartName={newPartName}
                              newPartQty={newPartQty}
                              newPartPrice={newPartPrice}
                              showAddPart={showAddPart}
                              addingPart={addingPart}
                              pendingPartPreview={pendingPartPreview}
                              editingPriceId={editingPartPriceId}
                              editingPriceVal={editingPartPriceVal}
                              onPartSearchChange={setPartSearch}
                              onNewPartNameChange={setNewPartName}
                              onNewPartQtyChange={setNewPartQty}
                              onNewPartPriceChange={setNewPartPrice}
                              onToggleAddPart={() =>
                                setShowAddPart(!showAddPart)
                              }
                              onAddPart={addPartLine}
                              onRemovePart={removePart}
                              onEditPriceStart={(id, val) => {
                                setEditingPartPriceId(id);
                                setEditingPartPriceVal(val);
                              }}
                              onEditPriceChange={setEditingPartPriceVal}
                              onEditPriceSave={handlePartPriceSave}
                              onEditPriceCancel={() =>
                                setEditingPartPriceId(null)
                              }
                              t={t}
                            />

                            <NotesSection
                              complaint={wo.complaint}
                              diagnosis={wo.diagnosis}
                              notes={wo.notes}
                              t={t}
                            />
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

                  <div className="mx-3 mb-3">
                    <TotalsSummary
                      servicesTotal={servicesTotal}
                      partsTotal={partsTotal}
                      grandTotal={Number(wo.total)}
                      t={t}
                    />
                  </div>

                  <DrawerFooter
                    wo={wo}
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
                    onMarkReady={handleReadyForPickup}
                    onComplete={() => setShowPickupForm(true)}
                    onCreateInvoice={generateInvoice}
                    t={t}
                  />
                </>
              ) : null}
            </DrawerSkeleton>
          </div>
        )}

        {/* Post-service form overlay inside drawer */}
        {showPostServiceForm && wo && (
          <PostServiceForm
            woId={workOrderId ?? ""}
            vehicleId={(wo.vehicle_id as string) ?? ""}
            vehiclePlate={
              (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
            }
            currentOdometer={
              (wo.vehicle as { odometer?: number | null })?.odometer ?? null
            }
            services={postFormServices}
            newStatus="Ready for Pickup"
            onConfirm={handlePostServiceFormSubmit}
            onCancel={handleCancelPostService}
          />
        )}

        <UnsavedWarning
          show={showUnsavedWarning}
          onDiscard={handleDiscard}
          onKeepEditing={() => setShowUnsavedWarning(false)}
          onSaveAndClose={handleSaveAndClose}
        />

        <DrawerCelebration show={showCelebration} message="Completed!" />
      </DrawerContent>

      {/* Pickup complete form overlay — outside DrawerContent to avoid Vaul + Base UI portal nesting */}
      {showPickupForm && wo && (
        <PickupCompleteForm
          woId={workOrderId ?? ""}
          vehiclePlate={
            (wo.vehicle as { plate_number?: string })?.plate_number ?? ""
          }
          totalCost={Number(wo.total ?? 0)}
          onConfirm={handlePickupSubmit}
          onCancel={handleCancelPickup}
        />
      )}
    </Drawer>
  );
}
