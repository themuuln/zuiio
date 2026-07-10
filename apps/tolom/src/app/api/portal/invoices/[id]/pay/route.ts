import { NextResponse } from "next/server";
import { apiError, ok } from "@/lib/api-response";
import { createPortalRouteHandler } from "@/lib/portal-auth";
import { recordPayment } from "@/lib/services/invoice-service";

export const POST = createPortalRouteHandler(
  async ({ request, customer, supabase }) => {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId || !body.amount) {
      return apiError(
        "VALIDATION_ERROR",
        "Invoice ID and amount are required",
        400,
      );
    }

    // Get the invoice to verify it belongs to this customer's org
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, organization_id, status, total, balance_due, customer_id")
      .eq("id", invoiceId)
      .is("deleted_at", null)
      .single();

    if (!invoice) {
      return apiError("NOT_FOUND", "Invoice not found", 404);
    }

    // Verify the invoice belongs to this customer
    if (invoice.customer_id !== customer.id) {
      return apiError("FORBIDDEN", "Invoice does not belong to you", 403);
    }

    // Verify invoice is payable
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return apiError(
        "INVALID_STATE",
        "This invoice is already paid or cancelled",
        400,
      );
    }

    // Record the payment
    await recordPayment(supabase, invoiceId, invoice.organization_id, {
      amount: body.amount,
      method: "bank_transfer",
      reference: body.reference ?? null,
      notes: body.notes ?? "Portal payment",
    });

    return ok({ success: true });
  },
);
