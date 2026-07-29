"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TotalsSummary } from "@/components/work-orders/line-items";
import type { WorkOrderPart, WorkOrderService } from "@/lib/types";
import type { WorkOrderDetail } from "@/lib/types/composite";
import { DrawerFooter } from "./_drawer-footer";
import type { CatalogPartItem, CatalogServiceItem } from "./_drawer-types";

// ── Dynamic imports (code-split heavy sections) ────────────────

const sectionLoading = (heightClass: string) => () => (
  <div className={`animate-pulse rounded-lg bg-muted/10 ${heightClass}`} />
);

const WorkOrderServicesSection = dynamic(
  () => import("./_services-section").then((m) => m.ServicesSection),
  { ssr: false, loading: sectionLoading("h-24") },
);
const WorkOrderPartsSection = dynamic(
  () => import("./_parts-section").then((m) => m.PartsSection),
  { ssr: false, loading: sectionLoading("h-24") },
);
const WorkOrderNotesSection = dynamic(
  () => import("./_notes-section").then((m) => m.NotesSection),
  { ssr: false, loading: sectionLoading("h-16") },
);
const WorkOrderTimelineSection = dynamic(
  () => import("./_status-timeline").then((m) => m.StatusTimeline),
  { ssr: false, loading: sectionLoading("h-32") },
);

// ── Props ───────────────────────────────────────────────────────

export interface DrawerContentPanelProps {
  wo: WorkOrderDetail;
  orgId: string;
  workOrderId: string;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  isFullScreen?: boolean;
  onAddServiceOpenChange: (open: boolean) => void;
  onEditServicePriceSave: (id: string, price: number) => Promise<void>;
  onEditServiceQtySave: (id: string, qty: number) => Promise<void>;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPartPriceSave: (id: string, price: number) => Promise<void>;
  onEditPartQtySave: (partId: string, qty: number) => Promise<void>;
  lastAddedServiceId?: string | null;
  lastAddedPartId?: string | null;
  onNotesUpdated: () => void;
  // Totals
  taxRate: number;
  // VAT toggle
  nuatEnabled: boolean;
  onNuatToggle: (checked: boolean) => Promise<void>;
  // Footer props
  saving: boolean;
  pendingAction?: string | null;
  confirmStatus: string | null;
  statusNotes: string;
  creatingInvoice: boolean;
  canCancel: boolean;
  canInvoice: boolean;
  invoicePublicToken: string | null;
  onChangeStatus: (status: string, notes?: string) => Promise<void>;
  onConfirmCancel: () => void;
  onStatusNotesChange: (val: string) => void;
  onMarkReady: () => Promise<void>;
  onComplete: () => void;
  onCreateInvoice: () => Promise<void>;
}

// ── Memoized zones ──────────────────────────────────────────────
// Each zone receives only the fields it needs from `wo`,
// so it re-renders only when its specific data changes.

const MemoizedServicesZone = memo(function MemoizedServicesZone({
  services,
  catalog,
  locale,
  isFullScreen,
  onAddServiceOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedServiceId,
}: {
  services: WorkOrderService[];
  catalog: CatalogServiceItem[];
  locale: string;
  isFullScreen?: boolean;
  onAddServiceOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (id: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedServiceId?: string | null;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 0 } as React.CSSProperties}
    >
      <WorkOrderServicesSection
        services={services}
        catalog={catalog}
        locale={locale}
        isFullScreen={isFullScreen}
        onAddServiceOpenChange={onAddServiceOpenChange}
        onEditPriceSave={onEditPriceSave}
        onEditQtySave={onEditQtySave}
        t={t}
        lastAddedServiceId={lastAddedServiceId}
      />
    </div>
  );
});

const MemoizedPartsZone = memo(function MemoizedPartsZone({
  parts,
  partsCatalog,
  locale,
  onAddPartOpenChange,
  onEditPriceSave,
  onEditQtySave,
  t,
  lastAddedPartId,
}: {
  parts: WorkOrderPart[];
  partsCatalog: CatalogPartItem[];
  locale: string;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPriceSave: (id: string, price: number) => Promise<void>;
  onEditQtySave: (partId: string, qty: number) => Promise<void>;
  t: (key: string) => string;
  lastAddedPartId?: string | null;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 1 } as React.CSSProperties}
    >
      <WorkOrderPartsSection
        parts={parts}
        partsCatalog={partsCatalog}
        locale={locale}
        onAddPartOpenChange={onAddPartOpenChange}
        onEditPriceSave={onEditPriceSave}
        onEditQtySave={onEditQtySave}
        t={t}
        lastAddedPartId={lastAddedPartId}
      />
    </div>
  );
});

const MemoizedNotesZone = memo(function MemoizedNotesZone({
  complaint,
  diagnosis,
  notes,
  orgId,
  workOrderId,
  onUpdated,
  t,
}: {
  complaint: string | null;
  diagnosis: string | null;
  notes: string | null;
  orgId: string;
  workOrderId: string;
  onUpdated: () => void;
  t: (key: string) => string;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 2 } as React.CSSProperties}
    >
      <WorkOrderNotesSection
        complaint={complaint}
        diagnosis={diagnosis}
        notes={notes}
        orgId={orgId}
        workOrderId={workOrderId}
        onUpdated={onUpdated}
        t={t}
      />
    </div>
  );
});

const MemoizedTimelineZone = memo(function MemoizedTimelineZone({
  statusHistory,
  serviceHistory,
  t,
}: {
  statusHistory: WorkOrderDetail["status_history"];
  serviceHistory: WorkOrderDetail["service_history"];
  t: (key: string) => string;
}) {
  return (
    <div
      className="[animation:fade-slide-in_300ms_ease-out-quart_backwards]"
      style={{ "--stagger": 3 } as React.CSSProperties}
    >
      <WorkOrderTimelineSection
        mode="status"
        statusHistory={statusHistory}
        serviceHistory={serviceHistory}
        t={t}
      />
    </div>
  );
});

// ── Component ───────────────────────────────────────────────────

export function DrawerContentPanel({
  wo,
  orgId,
  workOrderId,
  catalog,
  partsCatalog,
  isFullScreen,
  onAddServiceOpenChange,
  onEditServicePriceSave,
  onEditServiceQtySave,
  onAddPartOpenChange,
  onEditPartPriceSave,
  onEditPartQtySave,
  lastAddedServiceId,
  lastAddedPartId,
  onNotesUpdated,
  taxRate,
  nuatEnabled,
  onNuatToggle,
  saving,
  pendingAction,
  confirmStatus,
  statusNotes,
  creatingInvoice,
  canCancel,
  canInvoice,
  invoicePublicToken,
  onChangeStatus,
  onConfirmCancel,
  onStatusNotesChange,
  onMarkReady,
  onComplete,
  onCreateInvoice,
}: DrawerContentPanelProps) {
  const t = useTranslations("bayView") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const locale = useLocale();

  // ── Decompose wo into field-level references ──
  // Each memoized zone depends only on the fields it uses,
  // so it won't re-render when unrelated fields change.
  const services = wo.services ?? [];
  const parts = wo.parts ?? [];
  const statusHistory = wo.status_history ?? [];
  const serviceHistory = wo.service_history ?? [];
  const { complaint, diagnosis, notes } = wo;

  // ── Memoized totals ──
  const servicesTotal = useMemo(
    () => services.reduce((s, svc) => s + Number(svc.final_price), 0),
    [services],
  );
  const partsTotal = useMemo(
    () => parts.reduce((s, p) => s + Number(p.final_price), 0),
    [parts],
  );
  const grandTotal = servicesTotal + partsTotal;
  const discountTotal = wo.discount_total ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={
            isFullScreen
              ? "mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_19rem]"
              : "mx-auto w-full max-w-3xl px-4 py-4"
          }
        >
          <main className="min-w-0">
            <div className="flex flex-col gap-4">
              <MemoizedServicesZone
                services={services}
                catalog={catalog}
                locale={locale}
                isFullScreen={isFullScreen}
                onAddServiceOpenChange={onAddServiceOpenChange}
                onEditPriceSave={onEditServicePriceSave}
                onEditQtySave={onEditServiceQtySave}
                t={t}
                lastAddedServiceId={lastAddedServiceId}
              />

              <MemoizedPartsZone
                parts={parts}
                partsCatalog={partsCatalog}
                locale={locale}
                onAddPartOpenChange={onAddPartOpenChange}
                onEditPriceSave={onEditPartPriceSave}
                onEditQtySave={onEditPartQtySave}
                t={t}
                lastAddedPartId={lastAddedPartId}
              />

              {orgId && workOrderId ? (
                <MemoizedNotesZone
                  complaint={complaint}
                  diagnosis={diagnosis}
                  notes={notes}
                  orgId={orgId}
                  workOrderId={workOrderId}
                  onUpdated={onNotesUpdated}
                  t={t}
                />
              ) : null}
            </div>
          </main>

          <aside
            className={
              isFullScreen
                ? "min-w-0 border-t border-border/60 pt-4 xl:sticky xl:top-0 xl:border-l xl:border-t-0 xl:pl-4 xl:pt-0"
                : "mt-4 border-t border-border/60 pt-4"
            }
          >
            <MemoizedTimelineZone
              statusHistory={statusHistory}
              serviceHistory={serviceHistory}
              t={t}
            />
            {wo.created_at && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("openedDate", {
                  date: new Date(wo.created_at).toLocaleDateString(),
                })}
              </p>
            )}
          </aside>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/70 bg-card px-4 py-3">
        <div
          className={
            isFullScreen
              ? "mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          }
        >
          <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
            <div>
              <Label className="text-xs font-medium">
                {locale === "en" ? "VAT" : "НӨАТ"}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                {locale === "en"
                  ? "Value Added Tax"
                  : "Нэмэгдсэн Өртөгт Татвар"}
              </p>
            </div>
            <Switch checked={nuatEnabled} onCheckedChange={onNuatToggle} />
          </div>
          <div className="min-w-0 sm:min-w-[18rem]">
            <TotalsSummary
              servicesTotal={servicesTotal}
              partsTotal={partsTotal}
              grandTotal={grandTotal}
              serviceCount={services.length}
              partCount={parts.length}
              discountTotal={discountTotal}
              taxRate={taxRate}
              nuatEnabled={nuatEnabled}
              locale={locale}
              t={t}
            />
          </div>
        </div>
      </div>
      <DrawerFooter
        wo={wo}
        invoicePublicToken={invoicePublicToken}
        saving={saving}
        pendingAction={pendingAction}
        confirmStatus={confirmStatus}
        statusNotes={statusNotes}
        creatingInvoice={creatingInvoice}
        canCancel={canCancel}
        canInvoice={canInvoice}
        onChangeStatus={onChangeStatus}
        onConfirmCancel={onConfirmCancel}
        onStatusNotesChange={onStatusNotesChange}
        onMarkReady={onMarkReady}
        onComplete={onComplete}
        onCreateInvoice={onCreateInvoice}
        t={t}
      />
    </div>
  );
}
