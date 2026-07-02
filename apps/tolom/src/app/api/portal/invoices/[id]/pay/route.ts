import { NextResponse } from "next/server";
import { createPortalRouteHandler } from "@/lib/portal-auth";
import { recordPayment } from "@/lib/services/invoice-service";

export const POST = createPortalRouteHandler(
  async ({ request, customer, supabase }) => {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId || !body.amount) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invoice ID and amount are required",
          },
        },
        { status: 400 },
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
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invoice not found" } },
        { status: 404 },
      );
    }

    // Verify the invoice belongs to this customer
    if (invoice.customer_id !== customer.id) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Invoice does not belong to you",
          },
        },
        { status: 403 },
      );
    }

    // Verify invoice is payable
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_STATE",
            message: "This invoice is already paid or cancelled",
          },
        },
        { status: 400 },
      );
    }

    // Record the payment
    await recordPayment(supabase, invoiceId, invoice.organization_id, {
      amount: body.amount,
      method: "bank_transfer",
      reference: body.reference ?? null,
      notes: body.notes ?? "Portal payment",
    });

    return NextResponse.json({ success: true });
  },
);
