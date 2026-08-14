/**
 * Integration tests for the PUBLIC order tracking RPC
 * `get_public_order_status` (order number + contact phone verification).
 *
 * Covers: guest order tracking with the two facts a buyer knows (order id
 * or invoice number + phone), wrong-phone / unknown-order rejection,
 * unknown-slug rejection, and PII filtering (address/phone/email are never
 * returned to the caller).
 */

import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestBranch,
  createTestOrg,
  createTestProduct,
  trackCleanup,
} from "./helpers";

interface OrderRow {
  order_id: string;
  total_amount: number;
  status: string;
}

/** Org + catalog-enabled profile + default branch + stocked product. */
async function setupStore(admin: ReturnType<typeof createAdminClient>) {
  const { org, orgId } = await createTestOrg(admin);

  const { error: profileError } = await admin
    .from("organization_public_profiles")
    .upsert({
      organization_id: orgId,
      catalog_enabled: true,
      display_name: org.name,
    });
  if (profileError) {
    throw new Error(`Failed to enable catalog: ${profileError.message}`);
  }

  const { branchId } = await createTestBranch(admin, orgId);
  const { error: defaultError } = await admin
    .from("branches")
    .update({ is_default: true })
    .eq("id", branchId);
  if (defaultError) {
    throw new Error(`Failed to set default branch: ${defaultError.message}`);
  }

  const { productId } = await createTestProduct(admin, orgId, {
    currentStock: 20,
  });

  return { org, orgId, productId, branchId };
}

function orderItems(productId: string, quantity: number) {
  return [{ product_id: productId, quantity, variant_id: "" }];
}

async function placeGuestOrder(
  orgSlug: string,
  productId: string,
  phone: string,
  name: string,
): Promise<OrderRow> {
  const anon = createAnonClient();
  const { data, error } = await anon.rpc("submit_shop_order", {
    p_org_slug: orgSlug,
    p_items: orderItems(productId, 1),
    p_payment_method: "cash",
    p_contact_name: name,
    p_contact_phone: phone,
  } as never);

  if (error) throw new Error(`submit_shop_order failed: ${error.message}`);
  const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
  if (!row) throw new Error("submit_shop_order returned no order");
  trackCleanup("sales", row.order_id);
  return row;
}

async function track(
  orgSlug: string,
  orderNumber: string,
  phone: string,
): Promise<{ data: unknown; error: { message?: string } | null }> {
  const anon = createAnonClient();
  const result = await anon.rpc("get_public_order_status", {
    p_slug: orgSlug,
    p_order_number: orderNumber,
    p_contact_phone: phone,
  } as never);
  return result as { data: unknown; error: { message?: string } | null };
}

function orderOf(result: { data: unknown }): Record<string, unknown> | null {
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  return ((row as { order?: Record<string, unknown> } | null)?.order ??
    null) as Record<string, unknown> | null;
}

describe("get_public_order_status (public order tracking)", () => {
  const admin = createAdminClient();

  it("guest buyer tracks their order with order id + phone", async () => {
    const { org, productId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");

    const result = await track(org.slug, order.order_id, phone);
    const found = orderOf(result);

    expect(result.error).toBeNull();
    expect(found).not.toBeNull();
    expect(found).toMatchObject({
      id: order.order_id,
      status: "pending",
      total_amount: order.total_amount,
    });
    expect(Array.isArray(found?.items)).toBe(true);
    expect(found?.items).toHaveLength(1);
  });

  it("rejects a wrong phone for a valid order", async () => {
    const { org, productId } = await setupStore(admin);
    const order = await placeGuestOrder(
      org.slug,
      productId,
      `98${String(Date.now()).slice(-6)}`,
      "Бат",
    );

    const result = await track(org.slug, order.order_id, "99000000");

    expect(orderOf(result)).toBeNull();
  });

  it("rejects an unknown order number", async () => {
    const { org } = await setupStore(admin);

    const result = await track(
      org.slug,
      "00000000-0000-0000-0000-000000000000",
      `99${String(Date.now()).slice(-6)}`,
    );

    expect(orderOf(result)).toBeNull();
  });

  it("rejects an unknown store slug", async () => {
    const { org, productId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");

    const result = await track(
      `no-such-store-${Date.now()}`,
      order.order_id,
      phone,
    );

    expect(orderOf(result)).toBeNull();
  });

  it("never returns buyer PII (address, phone, email)", async () => {
    const { org, productId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");

    const result = await track(org.slug, order.order_id, phone);
    const found = orderOf(result);
    if (!found) throw new Error("expected order payload");

    expect(found).not.toHaveProperty("delivery_address");
    expect(found).not.toHaveProperty("contact_phone");
    expect(found).not.toHaveProperty("contact_email");
    expect(found).not.toHaveProperty("contact_name");
  });

  it("tracks an order by its invoice number when the org issues invoices", async () => {
    const { org, orgId, productId, branchId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");
    const invoiceNumber = `INV-${Date.now()}`;

    const { error: invError } = await admin.from("invoices").insert({
      organization_id: orgId,
      branch_id: branchId,
      sale_id: order.order_id,
      invoice_number: invoiceNumber,
      total_amount: order.total_amount,
    });
    if (invError) throw invError;

    const result = await track(org.slug, invoiceNumber, phone);
    const found = orderOf(result);

    expect(result.error).toBeNull();
    expect(found).toMatchObject({
      id: order.order_id,
      invoice_number: invoiceNumber,
      status: "pending",
    });
  });

  it("returns the latest delivery status and external tracking id", async () => {
    const { org, orgId, productId, branchId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");

    const { data: delivery } = await admin
      .from("deliveries")
      .insert({
        organization_id: orgId,
        sale_id: order.order_id,
        branch_id: branchId,
        contact_name: "Бат",
        contact_phone: phone,
        address: "УБ, СБД",
        status: "in_transit",
        external_tracking_id: "TRK-777",
      })
      .select("id")
      .single();
    if (!delivery) throw new Error("delivery insert failed");
    trackCleanup("deliveries", delivery.id);

    const result = await track(org.slug, order.order_id, phone);
    const found = orderOf(result);
    if (!found) throw new Error("expected order payload");

    expect(found.delivery).toMatchObject({
      status: "in_transit",
      external_tracking_id: "TRK-777",
    });
  });

  it("returns the persisted status_history timeline", async () => {
    const { org, productId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;
    const order = await placeGuestOrder(org.slug, productId, phone, "Бат");

    const result = await track(org.slug, order.order_id, phone);
    const found = orderOf(result);
    if (!found) throw new Error("expected order payload");

    expect(Array.isArray(found.status_history)).toBe(true);
  });

  it("tracks a signed-in buyer's order via their contact phone", async () => {
    const { org, productId } = await setupStore(admin);
    const phone = `99${String(Date.now()).slice(-6)}`;

    // Signed-in buyer places the order (order links store_account_id).
    // GoTrue admin createUser with email_confirm avoids the confirmation
    // email the local stack can't send (inbucket excluded).
    const email = `buyer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const password = "test-password-123";
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (createError || !created.user) {
      throw new Error(`admin createUser failed: ${createError?.message}`);
    }

    const { data: signIn, error: signInError } =
      await createAnonClient().auth.signInWithPassword({ email, password });
    if (signInError || !signIn.session) {
      throw new Error(`SignIn failed: ${signInError?.message}`);
    }
    const buyerClient = createClient(
      process.env.SUPABASE_URL ?? "http://127.0.0.1:54326",
      process.env.SUPABASE_ANON_KEY ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${signIn.session.access_token}`,
          },
        },
      },
    );

    const { data, error } = await buyerClient.rpc("submit_shop_order", {
      p_org_slug: org.slug,
      p_items: orderItems(productId, 1),
      p_payment_method: "cash",
      p_contact_name: "Бат",
      p_contact_phone: phone,
    } as never);
    if (error) throw new Error(`buyer order failed: ${error.message}`);
    const row = Array.isArray(data) ? (data[0] as OrderRow) : null;
    if (!row) throw new Error("buyer order returned no row");
    trackCleanup("sales", row.order_id);

    const result = await track(org.slug, row.order_id, phone);
    const found = orderOf(result);

    expect(result.error).toBeNull();
    expect(found).toMatchObject({ id: row.order_id, status: "pending" });
  });
});
