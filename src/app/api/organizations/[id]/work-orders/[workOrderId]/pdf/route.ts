/**
 * GET /api/organizations/[id]/work-orders/[workOrderId]/pdf
 * Generates and returns a work order as a PDF file.
 */

import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { WorkOrderDocument } from "@/lib/pdf/work-order-document";
import { getOrganization } from "@/lib/services/organization-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";
import { getWorkOrder } from "@/lib/services/work-order-service";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";

export const GET = createRouteHandler(async ({ params, supabase, orgId }) => {
  await requireActiveSubscription(orgId);
  const workOrderId = params.workOrderId;

  // Fetch work order with services, parts, customer, vehicle
  const workOrder = await getWorkOrder(supabase, workOrderId);

  // Fetch org + main branch for PDF header
  const [org, { data: branch }, { data: orgSettings }] = await Promise.all([
    getOrganization(supabase, params.id),
    supabase
      .from("branches")
      .select("name, address, phone, email")
      .eq("organization_id", params.id)
      .eq("is_main", true)
      .single(),
    supabase
      .from("organization_settings")
      .select("default_currency")
      .eq("organization_id", params.id)
      .single(),
  ]);

  // Render PDF
  const buffer = await renderToPdfBuffer(
    WorkOrderDocument({
      workOrder,
      org: { name: org.name, logo_url: org.logo_url },
      branch,
      settings: orgSettings,
    }),
  );

  const filename = pdfFilename(`work-order-${workOrderId.slice(0, 8)}`);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
