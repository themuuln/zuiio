/**
 * Integration tests for the Web Push notification system.
 *
 * Covers: push_subscriptions table CRUD, RLS policies (users can only
 * select/insert/delete their own rows), and cascade delete from
 * organizations.
 *
 * push_subscriptions is not in the generated Database types yet — the
 * parent regenerates types after all Wave 1 migrations land; `as never`
 * casts keep this spec compiling until then (same pattern as
 * src/app/api/domain-resolve/route.ts).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  createTestUserWithPermissions,
  trackCleanup,
} from "./helpers";

const SUBSCRIPTION = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint-1",
  p256dh:
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkRxZ8E4i2p0RXk8ZJ7f5sVQ8aCk",
  auth: "8hG6jM2nL4kP9vR1",
};

interface PushSubscriptionRow {
  id: string;
  organization_id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
}

async function insertSubscription(
  client: SupabaseClient,
  payload: {
    organization_id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string;
  },
): Promise<{ data: PushSubscriptionRow | null; error: unknown }> {
  const result = await client
    .from("push_subscriptions" as never)
    .insert(payload as never)
    .select()
    .single();
  return result as unknown as {
    data: PushSubscriptionRow | null;
    error: unknown;
  };
}

describe("Push subscription CRUD", () => {
  const admin = createAdminClient();

  it("service role can create a push subscription", async () => {
    const { orgId } = await createTestOrg(admin);
    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "Push CRUD",
      ["products.read"],
    );

    const { data: subscription, error } = await insertSubscription(admin, {
      organization_id: orgId,
      user_id: user.userId,
      endpoint: SUBSCRIPTION.endpoint,
      p256dh: SUBSCRIPTION.p256dh,
      auth: SUBSCRIPTION.auth,
      user_agent: "vitest",
    });

    expect(error).toBeNull();
    expect(subscription).not.toBeNull();
    expect(subscription!.organization_id).toBe(orgId);
    expect(subscription!.user_id).toBe(user.userId);
    expect(subscription!.endpoint).toBe(SUBSCRIPTION.endpoint);
    trackCleanup("push_subscriptions", subscription!.id);
  });

  it("deleting an organization cascades to its push subscriptions", async () => {
    const { orgId } = await createTestOrg(admin);
    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "Push cascade",
      ["products.read"],
    );

    const { data: subscription } = await insertSubscription(admin, {
      organization_id: orgId,
      user_id: user.userId,
      endpoint: "https://fcm.googleapis.com/fcm/send/cascade-endpoint",
      p256dh: SUBSCRIPTION.p256dh,
      auth: SUBSCRIPTION.auth,
    });
    expect(subscription).not.toBeNull();

    // Cascade: deleting the org removes its push subscriptions.
    // profiles rows reference organizations via a pre-existing FK, so
    // remove them first; the org delete then cascades push_subscriptions.
    await admin.from("profiles").delete().eq("organization_id", orgId);
    const { error } = await admin
      .from("organizations")
      .delete()
      .eq("id", orgId);
    expect(error).toBeNull();

    const { data: remaining } = (await admin
      .from("push_subscriptions" as never)
      .select("id")
      .eq("id" as never, subscription!.id)) as unknown as {
      data: Array<{ id: string }>;
    };
    expect(remaining).toEqual([]);
  });
});

describe("Push subscription RLS", () => {
  const admin = createAdminClient();

  it("anon cannot read push subscriptions", async () => {
    const { orgId } = await createTestOrg(admin);
    const user = await createTestUserWithPermissions(
      admin,
      orgId,
      "Push RLS anon",
      ["products.read"],
    );

    const { data: subscription } = await insertSubscription(admin, {
      organization_id: orgId,
      user_id: user.userId,
      endpoint: "https://fcm.googleapis.com/fcm/send/private-endpoint",
      p256dh: SUBSCRIPTION.p256dh,
      auth: SUBSCRIPTION.auth,
    });
    trackCleanup("push_subscriptions", subscription!.id);

    const anon = createAnonClient();
    const { data, error } = await anon
      .from("push_subscriptions" as never)
      .select("*")
      .eq("id" as never, subscription!.id);

    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it("user can read only their own subscriptions", async () => {
    const { orgId, org } = await createTestOrg(admin);
    const userA = await createTestUserWithPermissions(admin, orgId, org.name, [
      "products.read",
    ]);
    const userB = await createTestUserWithPermissions(
      admin,
      orgId,
      `${org.name}-b`,
      ["products.read"],
    );

    const { data: subB } = await insertSubscription(admin, {
      organization_id: orgId,
      user_id: userB.userId,
      endpoint: "https://fcm.googleapis.com/fcm/send/orgb-endpoint",
      p256dh: SUBSCRIPTION.p256dh,
      auth: SUBSCRIPTION.auth,
    });
    trackCleanup("push_subscriptions", subB!.id);

    // userA cannot see userB's subscription.
    const { data: resultsA, error: errorA } = await userA.client
      .from("push_subscriptions" as never)
      .select("*")
      .eq("id" as never, subB!.id);
    expect(errorA).toBeNull();
    expect(resultsA).toEqual([]);

    // userA can insert their own subscription and read it back.
    const { error: insertError } = await userA.client
      .from("push_subscriptions" as never)
      .insert({
        organization_id: orgId,
        user_id: userA.userId,
        endpoint: "https://fcm.googleapis.com/fcm/send/usera-endpoint",
        p256dh: SUBSCRIPTION.p256dh,
        auth: SUBSCRIPTION.auth,
      } as never);
    expect(insertError).toBeNull();

    const { data: resultsOwn } = (await userA.client
      .from("push_subscriptions" as never)
      .select("id")
      .eq(
        "endpoint" as never,
        "https://fcm.googleapis.com/fcm/send/usera-endpoint",
      )) as unknown as { data: Array<{ id: string }> };
    expect(resultsOwn).toHaveLength(1);
    trackCleanup("push_subscriptions", resultsOwn![0].id);

    // userA cannot delete userB's subscription: RLS filters the row
    // silently (0 rows affected, no error) — assert it is still there.
    const { error: deleteError } = await userA.client
      .from("push_subscriptions" as never)
      .delete()
      .eq("id" as never, subB!.id);
    expect(deleteError).toBeNull(); // silently skipped by RLS

    const { data: stillThere } = (await admin
      .from("push_subscriptions" as never)
      .select("id")
      .eq("id" as never, subB!.id)) as unknown as {
      data: Array<{ id: string }>;
    };
    expect(stillThere).toHaveLength(1);
  });
});
