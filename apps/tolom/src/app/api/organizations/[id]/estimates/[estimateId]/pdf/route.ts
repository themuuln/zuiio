import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { EstimateDocument } from "@/lib/pdf/estimate-document";
import { getEstimate } from "@/lib/services/estimate-service";
import { pdfFilename, renderToPdfBuffer } from "@/lib/utils/pdf";

export { dynamic } from "@/lib/api-handler";

export const GET = createRouteHandler(
  async ({ params, supabase, orgId }) => {
    const estimate = await getEstimate(supabase, params.estimateId, orgId);
    if (!estimate) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Estimate not found" } },
        { status: 404 },
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("name, phone, email, address")
      .eq("id", orgId)
      .single();

    const buffer = await renderToPdfBuffer(
      EstimateDocument({
        estimate: {
          ...estimate,
          discount_amount: Number(estimate.discount_amount ?? 0),
          discount_percentage: Number(estimate.discount_percentage ?? 0),
          discount_total: Number(estimate.discount_total ?? 0),
          tax_total: Number(estimate.tax_total ?? 0),
          grand_total: Number(estimate.grand_total ?? 0),
          subtotal: Number(estimate.subtotal ?? 0),
          items: (estimate.items ?? []).map((item) => ({
            ...item,
            unit_price: Number(item.unit_price),
            discount_amount: Number(item.discount_amount ?? 0),
            discount_percentage: Number(item.discount_percentage ?? 0),
            line_total: Number(item.line_total),
          })),
        },
        org: org ?? { name: "TOLOM" },
      }),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename(estimate.estimate_number)}.pdf"`,
      },
    });
  },
  { requiredPermission: { resource: "work_orders", action: "read" } },
);
