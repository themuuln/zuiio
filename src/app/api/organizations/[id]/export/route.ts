import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import type {
  Branch,
  Customer,
  InventoryMovement,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  MechanicAssignment,
  Organization,
  OrganizationUser,
  PartsCatalog,
  PartPriceHistory,
  Profile,
  PurchaseOrder,
  PurchaseOrderItem,
  Role,
  ServiceCatalog,
  ServicePriceHistory,
  StockThreshold,
  Supplier,
  Vehicle,
  VehicleModel,
  VehicleOwner,
  WorkOrder,
  WorkOrderHelper,
  WorkOrderNote,
  WorkOrderPart,
  WorkOrderService,
  WorkOrderStatusHistory,
} from "@/lib/types";

interface OrgExport {
  exported_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    settings: Record<string, unknown> | null;
  };
  branches: Branch[];
  users: (OrganizationUser & {
    profiles: Pick<Profile, "full_name" | "email"> | null;
  })[];
  roles: Role[];
  customers: Customer[];
  vehicles: Vehicle[];
  vehicle_owners: VehicleOwner[];
  work_orders: WorkOrder[];
  work_order_services: WorkOrderService[];
  work_order_parts: WorkOrderPart[];
  work_order_status_history: WorkOrderStatusHistory[];
  service_catalog: ServiceCatalog[];
  service_price_history: ServicePriceHistory[];
  part_price_history: PartPriceHistory[];
  parts_catalog: PartsCatalog[];
  vehicle_models: VehicleModel[];
  suppliers: Supplier[];
  purchase_orders: PurchaseOrder[];
  purchase_order_items: PurchaseOrderItem[];
  inventory_movements: InventoryMovement[];
  payments: Record<string, unknown>[];
  invoices: Invoice[];
  invoice_items: InvoiceItem[];
  invoice_payments: InvoicePayment[];
  stock_thresholds: StockThreshold[];
  mechanic_assignments: MechanicAssignment[];
  work_order_notes: WorkOrderNote[];
}

async function fetchAll<T>(
  supabase: ReturnType<
    typeof import("@/lib/supabase/server").createClient
  > extends Promise<infer R>
    ? R
    : never,
  table: string,
  orgId: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to export ${table}: ${error.message}`);
  return (data ?? []) as unknown as T[];
}

export const GET = createRouteHandler(async ({ orgId, supabase }) => {
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, settings")
    .eq("id", orgId)
    .single();

  if (!org) {
    return NextResponse.json(
      { error: { message: "Organization not found" } },
      { status: 404 },
    );
  }

  const tables: Record<string, string> = {
    branches: "branches",
    roles: "roles",
    customers: "customers",
    vehicles: "vehicles",
    vehicle_owners: "vehicle_owners",
    work_orders: "work_orders",
    work_order_services: "work_order_services",
    work_order_parts: "work_order_parts",
    work_order_status_history: "work_order_status_history",
    service_catalog: "service_catalog",
    service_price_history: "service_price_history",
    part_price_history: "part_price_history",
    parts_catalog: "parts_catalog",
    vehicle_models: "vehicle_models",
    suppliers: "suppliers",
    purchase_orders: "purchase_orders",
    purchase_order_items: "purchase_order_items",
    inventory_movements: "inventory_movements",
    payments: "payments",
    invoices: "invoices",
    invoice_items: "invoice_items",
    invoice_payments: "invoice_payments",
    stock_thresholds: "stock_thresholds",
    mechanic_assignments: "mechanic_assignments",
    work_order_notes: "work_order_notes",
  };

  const [{ data: users }, tableEntries] = await Promise.all([
    supabase
      .from("organization_users")
      .select("*, profiles(full_name, email)")
      .eq("organization_id", orgId),
    Promise.all(
      Object.entries(tables).map(async ([key, table]) => {
        const data = await fetchAll(supabase, table, orgId);
        return [key, data] as const;
      }),
    ),
  ]);
  const results: Record<string, unknown[]> = Object.fromEntries(tableEntries);

  const exportData: OrgExport = {
    exported_at: new Date().toISOString(),
    organization: org,
    branches: results.branches as OrgExport["branches"],
    users: (users ?? []) as unknown as OrgExport["users"],
    roles: results.roles as OrgExport["roles"],
    customers: results.customers as OrgExport["customers"],
    vehicles: results.vehicles as OrgExport["vehicles"],
    vehicle_owners: results.vehicle_owners as OrgExport["vehicle_owners"],
    work_orders: results.work_orders as OrgExport["work_orders"],
    work_order_services:
      results.work_order_services as OrgExport["work_order_services"],
    work_order_parts: results.work_order_parts as OrgExport["work_order_parts"],
    work_order_status_history:
      results.work_order_status_history as OrgExport["work_order_status_history"],
    service_catalog: results.service_catalog as OrgExport["service_catalog"],
    service_price_history:
      results.service_price_history as OrgExport["service_price_history"],
    part_price_history:
      results.part_price_history as OrgExport["part_price_history"],
    parts_catalog: results.parts_catalog as OrgExport["parts_catalog"],
    vehicle_models: results.vehicle_models as OrgExport["vehicle_models"],
    suppliers: results.suppliers as OrgExport["suppliers"],
    purchase_orders: results.purchase_orders as OrgExport["purchase_orders"],
    purchase_order_items:
      results.purchase_order_items as OrgExport["purchase_order_items"],
    inventory_movements:
      results.inventory_movements as OrgExport["inventory_movements"],
    payments: results.payments as OrgExport["payments"],
    invoices: results.invoices as OrgExport["invoices"],
    invoice_items: results.invoice_items as OrgExport["invoice_items"],
    invoice_payments: results.invoice_payments as OrgExport["invoice_payments"],
    stock_thresholds: results.stock_thresholds as OrgExport["stock_thresholds"],
    mechanic_assignments:
      results.mechanic_assignments as OrgExport["mechanic_assignments"],
    work_order_notes: results.work_order_notes as OrgExport["work_order_notes"],
  };

  const filename = `tolom-export-${org.slug}-${new Date().toISOString().split("T")[0]}.json`;
  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
