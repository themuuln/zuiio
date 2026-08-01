import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-alert-webhook-secret",
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendSmsAlerts(
  supabase: SupabaseClient,
  report: Record<string, string | null>,
  recipientIds: string[],
  eventType: string,
): Promise<number> {
  const webhookUrl = Deno.env.get("SMS_ALERT_WEBHOOK_URL");
  if (recipientIds.length === 0) return 0;
  if (!webhookUrl) throw new Error("SMS_ALERT_WEBHOOK_URL not configured");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, phone")
    .in("id", recipientIds);
  if (error) throw error;

  const eventLabel =
    eventType === "report_closed"
      ? "Мэдээлэл шинэчлэгдлээ"
      : eventType === "sighting_created"
        ? "Шинэ ажиглалт бүртгэгдлээ"
        : "Шинэ зар бүртгэгдлээ";
  const messages = (profiles ?? [])
    .filter(
      (profile) =>
        typeof profile.phone === "string" && profile.phone.length > 0,
    )
    .map((profile) => ({
      to: profile.phone,
      body: `${report.horse_name ?? "Морь"} · ${report.location_aimag ?? "Байршил тодорхойгүй"} · ${eventLabel}`,
      report_id: report.id,
      event_type: eventType,
    }));
  if (messages.length === 0) return 0;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(Deno.env.get("SMS_ALERT_WEBHOOK_SECRET")
        ? { "x-webhook-secret": Deno.env.get("SMS_ALERT_WEBHOOK_SECRET")! }
        : {}),
    },
    body: JSON.stringify({ messages }),
  });
  if (!response.ok)
    throw new Error(`SMS alert webhook returned ${response.status}`);
  return messages.length;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const reportId = typeof body.report_id === "string" ? body.report_id : null;
    if (!reportId) return jsonResponse({ error: "report_id is required" }, 400);
    let isOwner = false;

    const webhookSecret = Deno.env.get("LOST_HORSE_ALERT_WEBHOOK_SECRET");
    const isWebhook =
      webhookSecret &&
      req.headers.get("x-alert-webhook-secret") === webhookSecret;
    if (!isWebhook) {
      const authorization = req.headers.get("Authorization");
      const jwt = authorization?.replace(/^Bearer\s+/i, "");
      if (!jwt) return jsonResponse({ error: "Unauthorized" }, 401);
      const { data: authData, error: authError } =
        await supabase.auth.getUser(jwt);
      if (authError || !authData.user)
        return jsonResponse({ error: "Unauthorized" }, 401);

      const { data: ownedReport, error: ownerError } = await supabase
        .from("lost_horse_reports")
        .select("id")
        .eq("id", reportId)
        .eq("owner_id", authData.user.id)
        .maybeSingle();
      if (ownerError) throw ownerError;
      isOwner = Boolean(ownedReport);

      if (!ownedReport) {
        const { data: reportedSighting, error: sightingError } = await supabase
          .from("lost_horse_sightings")
          .select("id")
          .eq("report_id", reportId)
          .eq("reporter_id", authData.user.id)
          .limit(1)
          .maybeSingle();
        if (sightingError) throw sightingError;
        if (!reportedSighting) return jsonResponse({ error: "Forbidden" }, 403);
      }
    }

    const { data: claimedJobs, error: claimError } = await supabase.rpc(
      "claim_lost_horse_alert_jobs",
      { p_limit: 1, p_lease_seconds: 60, p_report_id: reportId },
    );
    if (claimError) throw claimError;
    const job = claimedJobs?.[0] ?? null;
    if (!job)
      return jsonResponse({
        success: true,
        skipped: true,
        reason: "No pending job",
      });
    if (!isWebhook && !isOwner && job.event_type !== "sighting_created") {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    try {
      const { data: report, error: reportError } = await supabase
        .from("lost_horse_reports")
        .select(
          "id, horse_name, location_aimag, location_sum, location_bag, status",
        )
        .eq("id", reportId)
        .single();
      if (reportError || !report)
        throw reportError ?? new Error("Report not found");

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from("lost_horse_alert_subscriptions")
        .select(
          "user_id, location_sum, location_bag, push_enabled, sms_enabled",
        )
        .eq("location_aimag", report.location_aimag)
        .is("revoked_at", null);
      if (subscriptionError) throw subscriptionError;

      const matchingSubscriptions = (subscriptions ?? []).filter(
        (subscription) =>
          (!subscription.location_sum ||
            subscription.location_sum === report.location_sum) &&
          (!subscription.location_bag ||
            subscription.location_bag === report.location_bag),
      );
      const pushRecipientIds = [
        ...new Set(
          matchingSubscriptions
            .filter((subscription) => subscription.push_enabled)
            .map((subscription) => subscription.user_id),
        ),
      ];
      const smsRecipientIds = [
        ...new Set(
          matchingSubscriptions
            .filter((subscription) => subscription.sms_enabled)
            .map((subscription) => subscription.user_id),
        ),
      ];
      const smsSent = await sendSmsAlerts(
        supabase,
        report,
        smsRecipientIds,
        job.event_type,
      );

      if (pushRecipientIds.length === 0) {
        await supabase
          .from("lost_horse_alert_jobs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("claim_token", job.claim_token);
        return jsonResponse({ success: true, sent: 0, sms_sent: smsSent });
      }

      const { data: devices, error: deviceError } = await supabase
        .from("user_devices")
        .select("fcm_token")
        .in("user_id", pushRecipientIds);
      if (deviceError) throw deviceError;
      const tokens = (devices ?? [])
        .map((device) => device.fcm_token)
        .filter(Boolean);

      if (tokens.length === 0) {
        await supabase
          .from("lost_horse_alert_jobs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", job.id)
          .eq("claim_token", job.claim_token);
        return jsonResponse({
          success: true,
          sent: 0,
          sms_sent: smsSent,
          reason: "No device tokens",
        });
      }

      const firebaseServiceAccount = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
      if (!firebaseServiceAccount)
        throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
      const serviceAccount = JSON.parse(firebaseServiceAccount);
      const { initializeApp, cert } = await import(
        "https://esm.sh/firebase-admin@12/app"
      );
      const { getMessaging } = await import(
        "https://esm.sh/firebase-admin@12/messaging"
      );
      const app = initializeApp({ credential: cert(serviceAccount) });
      const result = await getMessaging(app).sendEachForMulticast({
        notification: {
          title:
            job.event_type === "report_closed"
              ? "Морь олдсон тухай шинэчлэлт"
              : job.event_type === "sighting_created"
                ? "Шинэ ажиглалт бүртгэгдлээ"
                : "Ойр орчимд хаяж морь бүртгэгдлээ",
          body: `${report.horse_name ?? "Морь"} · ${report.location_aimag ?? "Байршил тодорхойгүй"}`,
        },
        data: {
          type: "lost_horse_alert",
          report_id: report.id,
          event_type: job.event_type,
        },
        tokens,
      });

      const failedTokens: string[] = [];
      result.responses.forEach((response, index) => {
        if (!response.success) failedTokens.push(tokens[index]);
      });
      if (failedTokens.length > 0) {
        await supabase
          .from("user_devices")
          .delete()
          .in("fcm_token", failedTokens);
      }
      await supabase
        .from("lost_horse_alert_jobs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("claim_token", job.claim_token);
      return jsonResponse({
        success: true,
        sent: result.successCount,
        failed: result.failureCount,
        sms_sent: smsSent,
      });
    } catch (error) {
      await supabase
        .from("lost_horse_alert_jobs")
        .update({
          status: "failed",
          next_attempt_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          last_error: error instanceof Error ? error.message : String(error),
        })
        .eq("id", job.id)
        .eq("claim_token", job.claim_token);
      throw error;
    }
  } catch (error) {
    console.error("Lost-horse alert dispatch error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal error" },
      500,
    );
  }
});
