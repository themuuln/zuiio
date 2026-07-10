import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Verify webhook signature using HMAC-SHA256 */
async function verifySignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Signature verification
    const signature = req.headers.get("x-webhook-signature") ?? "";
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET") ?? "";
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: WEBHOOK_SECRET not set",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing webhook signature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }
    const rawBody = await req.clone().text();
    const valid = await verifySignature(rawBody, signature, webhookSecret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    const source = req.headers.get("x-webhook-source") ?? "unknown";

    switch (source) {
      case "payment": {
        const { payment_id, status } = body as {
          payment_id: string;
          status: string;
        };
        if (status === "completed") {
          await supabase
            .from("payments")
            .update({ status: "confirmed" })
            .eq("id", payment_id);
        }
        break;
      }
      case "notification": {
        const { notification_id, delivered } = body as {
          notification_id: string;
          delivered: boolean;
        };
        break;
      }
      default:
    }

    return new Response(JSON.stringify({ received: true, source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
