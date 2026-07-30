"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { memo } from "react";
import type { WorkOrderPart, WorkOrderService } from "@/lib/types";
import type { WorkOrderDetail } from "@/lib/types/composite";
import type { MechanicRef } from "@/lib/types/mechanic";
import type { BayCardMechanic } from "./_bay-card-types";
import { DrawerSidebar } from "./_drawer-sidebar";
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

// ── Props ───────────────────────────────────────────────────────

export interface DrawerContentPanelProps {
  wo: WorkOrderDetail;
  orgId: string;
  workOrderId: string;
  catalog: CatalogServiceItem[];
  partsCatalog: CatalogPartItem[];
  isFullScreen?: boolean;
  // Service/part callbacks
  onAddServiceOpenChange: (open: boolean) => void;
  onEditServicePriceSave: (id: string, price: number) => Promise<void>;
  onEditServiceQtySave: (id: string, qty: number) => Promise<void>;
  onAddPartOpenChange: (open: boolean) => void;
  onEditPartPriceSave: (id: string, price: number) => Promise<void>;
  onEditPartQtySave: (partId: string, qty: number) => Promise<void>;
  lastAddedServiceId?: string | null;
  lastAddedPartId?: string | null;
  onNotesUpdated: () => void;
  // Sidebar props
  mechanics: BayCardMechanic[];
  helpers: MechanicRef[];
  onAssignMechanic: (
    mechanicId: string,
    fullName?: string | null,
  ) => Promise<void>;
  onHelpersChange: () => void;
  onShowCustomerPicker: () => void;
}

// ── Memoized zones ──────────────────────────────────────────────

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
  mechanics,
  helpers,
  onAssignMechanic,
  onHelpersChange,
  onShowCustomerPicker,
}: DrawerContentPanelProps) {
  const t = useTranslations("bayView") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const locale = useLocale();

  // ── Decompose wo into field-level references ──
  const services = wo.services ?? [];
  const parts = wo.parts ?? [];
  const { complaint, diagnosis, notes } = wo;

  // ── Sidebar t function (same keys, broader params) ──
  // The sidebar and its children need the full t signature for dates etc.
  const sidebarT = useTranslations("bayView") as (
    key: string,
    params?: Record<string, string | number | Date>,
  ) => string;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div
        className={
          isFullScreen
            ? "mx-auto grid w-full max-w-7xl items-start gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_19rem]"
            : "mx-auto w-full max-w-3xl px-4 py-4"
        }
      >
        {/* Main content column */}
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

        {/* Sidebar — renders as right column in fullscreen, bottom cards otherwise */}
        {isFullScreen ? (
          <aside className="min-w-0">
            <DrawerSidebar
              wo={wo}
              allMechanics={mechanics}
              helpers={helpers}
              orgId={orgId}
              workOrderId={workOrderId}
              onShowCustomerPicker={onShowCustomerPicker}
              onAssignMechanic={onAssignMechanic}
              onHelpersChange={onHelpersChange}
              t={sidebarT}
            />
          </aside>
        ) : (
          <div className="mt-4 border-t border-border/60 pt-4">
            <DrawerSidebar
              wo={wo}
              allMechanics={mechanics}
              helpers={helpers}
              orgId={orgId}
              workOrderId={workOrderId}
              onShowCustomerPicker={onShowCustomerPicker}
              onAssignMechanic={onAssignMechanic}
              onHelpersChange={onHelpersChange}
              t={sidebarT}
            />
          </div>
        )}
      </div>
    </div>
  );
}
