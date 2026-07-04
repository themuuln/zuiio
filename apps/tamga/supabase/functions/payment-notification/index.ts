// payment-notification — Send FCM push after payment verification
// Called by payment-sms-webhook (best-effort) or admin verification flow.
// Queries user_devices for target user's FCM tokens,
// sends push via Firebase Admin SDK.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Notification Content ─────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  pro: "Pro",
  breeder: "Breeder",
  stable: "Stable",
};

function getNotificationContent(tier: string): { title: string; body: string } {
  const tierLabel = TIER_LABELS[tier] || tier;
  return {
    title: "Төлбөр баталгаажлаа! 🎉",
    body: `${tierLabel} захиалга идэвхжлээ. Баярлалаа!`,
  };
}

// ── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { user_id, tier, payment_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 1. Initialize Supabase client (service role) ────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Check user preferences ───────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("notifications_enabled, notify_payment_notifications")
      .eq("id", user_id)
      .single();

    if (profile && (!profile.notifications_enabled || !profile.notify_payment_notifications)) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "User has payment notifications disabled",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. Query user_devices for FCM tokens ────────────────
    const { data: devices, error: devicesError } = await supabase
      .from("user_devices")
      .select("fcm_token, platform")
      .eq("user_id", user_id);

    if (devicesError || !devices || devices.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "No devices found for user",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 4. Get Firebase service account ─────────────────────
    const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!firebaseServiceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }

    const serviceAccount = JSON.parse(firebaseServiceAccount);

    // ── 5. Initialize Firebase Admin SDK ────────────────────
    // Using firebase-admin from esm.sh
    const { initializeApp, cert } = await import(
      "https://esm.sh/firebase-admin@12/app"
    );
    const { getMessaging } = await import(
      "https://esm.sh/firebase-admin@12/messaging"
    );

    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    const messaging = getMessaging(app);

    // ── 6. Send FCM push to all devices ─────────────────────
    const { title, body } = getNotificationContent(tier || "pro");
    const tokens = devices.map((d) => d.fcm_token);

    const result = await messaging.sendEachForMulticast({
      notification: { title, body },
      data: {
        type: "payment_verified",
        payment_id: payment_id || "",
        tier: tier || "pro",
      },
      tokens,
    });

    // ── 7. Handle failed tokens ─────────────────────────────
    const failedTokens: string[] = [];
    if (result.failureCount > 0) {
      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.warn(
            `FCM failed for token ${tokens[idx].substring(0, 20)}...:`,
            resp.error?.message
          );
        }
      });

      // Clean up stale tokens
      if (failedTokens.length > 0) {
        await supabase
          .from("user_devices")
          .delete()
          .in("fcm_token", failedTokens);
      }
    }

    // ── 8. Return success ───────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        sent: result.successCount,
        failed: result.failureCount,
        cleanedTokens: failedTokens.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Payment notification error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Internal notification error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
