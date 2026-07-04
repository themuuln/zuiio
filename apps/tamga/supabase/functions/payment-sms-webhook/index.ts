// payment-sms-webhook — Receive bank SMS and auto-verify payments
// Receives forwarded SMS from GSM modem or Android SMS forwarding app.
// Validates HMAC-SHA256 signature, parses TG-XXXX-XXXX code,
// matches against payment_requests, calls verify_payment() RPC.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

// ── HMAC Validation ──────────────────────────────────────────

async function verifyHmac(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return signature === expected;
}

// ── SMS Parsing ──────────────────────────────────────────────

// Payment code pattern: TG-XXXX-XXXX (excludes 0/O/I/1 for clarity)
const PAYMENT_CODE_REGEX = /TG-[A-Z2-9]{4}-[A-Z2-9]{4}/;

// Amount patterns: "9,900₮" or "9900₮" or "9900 MNT"
const AMOUNT_REGEX = /(\d[\d,]*)\s*(?:₮|MNT)/;

interface ParsedSms {
  code: string | null;
  amount: number | null;
  rawBody: string;
}

function parseSms(body: string): ParsedSms {
  const codeMatch = body.match(PAYMENT_CODE_REGEX);
  const amountMatch = body.match(AMOUNT_REGEX);

  let amount: number | null = null;
  if (amountMatch) {
    amount = parseInt(amountMatch[1].replace(/,/g, ""), 10);
  }

  return {
    code: codeMatch ? codeMatch[0] : null,
    amount,
    rawBody: body.substring(0, 500), // Truncate for storage
  };
}

// ── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 1. Validate HMAC signature ──────────────────────────
    const webhookSecret = Deno.env.get("SMS_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("SMS_WEBHOOK_SECRET not configured");
    }

    const signature = req.headers.get("x-webhook-signature") || "";
    const rawBody = await req.text();

    if (!signature || !(await verifyHmac(rawBody, signature, webhookSecret))) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 2. Parse request body ───────────────────────────────
    const payload = JSON.parse(rawBody);
    const { from, body: smsBody, timestamp } = payload;

    if (!smsBody || typeof smsBody !== "string") {
      return new Response(
        JSON.stringify({ error: "smsBody is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 3. Parse SMS for payment code ───────────────────────
    const parsed = parseSms(smsBody);

    if (!parsed.code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No payment code found in SMS",
          rawBody: parsed.rawBody,
        }),
        {
          status: 200, // 200 — SMS received but no action needed
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 4. Initialize Supabase client (service role) ────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 5. Match payment code against pending requests ──────
    const { data: payment, error: lookupError } = await supabase
      .from("payment_requests")
      .select("id, user_id, tier, amount_mnt, code, expires_at, status")
      .eq("code", parsed.code)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (lookupError || !payment) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No matching pending payment found",
          code: parsed.code,
        }),
        {
          status: 200, // 200 — SMS processed, no matching payment
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 6. Optional: validate amount ────────────────────────
    // Amount check is defense-in-depth — code match is authoritative
    if (parsed.amount !== null && parsed.amount !== payment.amount_mnt) {
      console.warn(
        `Amount mismatch: SMS=${parsed.amount}, expected=${payment.amount_mnt}`
      );
      // Continue anyway — code match is primary
    }

    // ── 7. Call verify_payment() RPC ────────────────────────
    const { data: verifyResult, error: verifyError } = await supabase.rpc(
      "verify_payment",
      {
        p_payment_id: payment.id,
        p_admin_notes: `Auto-verified via SMS: ${parsed.rawBody}`,
      }
    );

    if (verifyError) {
      console.error("verify_payment RPC error:", verifyError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment verification failed",
          details: verifyError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!verifyResult?.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: verifyResult?.error || "Verification returned false",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 8. Trigger payment notification (best-effort) ───────
    // Call payment-notification Edge Function to send FCM push
    try {
      await fetch(`${supabaseUrl}/functions/v1/payment-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          user_id: payment.user_id,
          tier: payment.tier,
          payment_id: payment.id,
        }),
      });
    } catch (notifErr) {
      // Non-fatal — payment is verified even if notification fails
      console.warn("Payment notification failed (non-fatal):", notifErr);
    }

    // ── 9. Return success ───────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        payment_id: payment.id,
        code: parsed.code,
        tier: payment.tier,
        user_id: payment.user_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("SMS webhook error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Internal webhook error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
