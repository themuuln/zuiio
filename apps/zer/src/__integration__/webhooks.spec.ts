/**
 * Integration tests for the Webhooks system.
 *
 * Covers: webhook_subscriptions / webhook_deliveries table CRUD, RLS
 * policies, org scoping, and cascade delete from subscriptions.
 */

import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

describe("Webhook CRUD", () => {
  const admin = createAdminClient();

  it("service role can create a webhook subscription", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: webhook, error } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgId,
        name: "Худалдааны вебхук",
        url: "https://example.com/hooks/sale",
        secret: "test-secret",
        event_types: ["sale.created", "stock.low"],
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(webhook).not.toBeNull();
    expect(webhook!.organization_id).toBe(orgId);
    expect(webhook!.event_types).toEqual(["sale.created", "stock.low"]);
    expect(webhook!.is_active).toBe(true);
    trackCleanup("webhook_subscriptions", webhook!.id);
  });

  it("deleting a subscription cascades to its deliveries", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: webhook } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgId,
        name: "Cascade test",
        url: "https://example.com/hooks/cascade",
        event_types: ["invoice.paid"],
        is_active: true,
      })
      .select()
      .single();
    expect(webhook).not.toBeNull();

    const { data: delivery } = await admin
      .from("webhook_deliveries")
      .insert({
        organization_id: orgId,
        subscription_id: webhook!.id,
        event_type: "invoice.paid",
        payload: { invoice_id: "inv-1" },
        status: "pending",
        attempts: 0,
      })
      .select()
      .single();
    expect(delivery).not.toBeNull();

    // Cascade: deleting the subscription removes its deliveries.
    const { error } = await admin
      .from("webhook_subscriptions")
      .delete()
      .eq("id", webhook!.id);
    expect(error).toBeNull();

    const { data: remaining } = await admin
      .from("webhook_deliveries")
      .select("id")
      .eq("subscription_id", webhook!.id);
    expect(remaining).toEqual([]);
  });
});

describe("Webhook RLS", () => {
  const admin = createAdminClient();

  it("anon cannot read webhook subscriptions", async () => {
    const { orgId } = await createTestOrg(admin);

    const { data: webhook } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgId,
        name: "Private webhook",
        url: "https://example.com/hooks/private",
        event_types: ["sale.created"],
        is_active: true,
      })
      .select()
      .single();
    trackCleanup("webhook_subscriptions", webhook!.id);

    const anon = createAnonClient();
    const { data, error } = await anon
      .from("webhook_subscriptions")
      .select("*")
      .eq("id", webhook!.id);

    expect(error).toBeNull(); // table grants exist; RLS row policies block
    expect(data ?? []).toHaveLength(0);
  });

  it("user with webhooks.read can read own org webhooks", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: webhook } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgId,
        name: "Readable webhook",
        url: "https://example.com/hooks/readable",
        event_types: ["sale.created"],
        is_active: true,
      })
      .select()
      .single();
    trackCleanup("webhook_subscriptions", webhook!.id);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "webhooks.read",
    ]);

    const { data: results, error } = await user.client
      .from("webhook_subscriptions")
      .select("*")
      .eq("id", webhook!.id);

    expect(error).toBeNull();
    expect(results).toHaveLength(1);
    expect(results![0].id).toBe(webhook!.id);
  });

  it("user with webhooks.create can create subscriptions", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "webhooks.create",
    ]);

    const { error } = await user.client.from("webhook_subscriptions").insert({
      organization_id: orgId,
      name: "User webhook",
      url: "https://example.com/hooks/user",
      event_types: ["sale.created"],
      is_active: false,
    });

    expect(error).toBeNull();

    const { data: webhooks } = await admin
      .from("webhook_subscriptions")
      .select("id")
      .eq("organization_id", orgId)
      .eq("name", "User webhook");
    expect(webhooks).toHaveLength(1);
    trackCleanup("webhook_subscriptions", webhooks![0].id);
  });

  it("user without webhooks.read cannot read webhooks", async () => {
    const { orgId, org } = await createTestOrg(admin);

    const { data: webhook } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgId,
        name: "Restricted webhook",
        url: "https://example.com/hooks/restricted",
        event_types: ["sale.created"],
        is_active: true,
      })
      .select()
      .single();
    trackCleanup("webhook_subscriptions", webhook!.id);

    const user = await createTestUserWithPermissions(admin, orgId, org.name, [
      "products.read",
    ]);

    const { data: results, error } = await user.client
      .from("webhook_subscriptions")
      .select("*")
      .eq("id", webhook!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });

  it("RLS scopes webhooks to organization", async () => {
    const { orgId: orgA, org: orgAEntity } = await createTestOrg(admin);
    const { orgId: orgB } = await createTestOrg(admin);

    const { data: webhookB } = await admin
      .from("webhook_subscriptions")
      .insert({
        organization_id: orgB,
        name: "Org B webhook",
        url: "https://example.com/hooks/orgb",
        event_types: ["sale.created"],
        is_active: true,
      })
      .select()
      .single();
    trackCleanup("webhook_subscriptions", webhookB!.id);

    const userA = await createTestUserWithPermissions(
      admin,
      orgA,
      orgAEntity.name,
      ["webhooks.read"],
    );

    const { data: results, error } = await userA.client
      .from("webhook_subscriptions")
      .select("*")
      .eq("id", webhookB!.id);

    expect(error).toBeNull();
    expect(results).toEqual([]);
  });
});
