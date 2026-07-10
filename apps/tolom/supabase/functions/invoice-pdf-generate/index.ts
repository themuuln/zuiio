import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Escape HTML special characters to prevent XSS */
function esc(val: unknown): string {
  const s = String(val ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // JWT auth — derive org from authenticated user, not request body
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }
    const token = authHeader.slice(7);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { work_order_id } = await req.json();

    // Derive org_id from the authenticated user's organization_users table
    const { data: membership } = await supabase
      .from("organization_users")
      .select("organization_id")
      .eq("user_id", user.id)
      .is("removed_at", null)
      .maybeSingle();

    const org_id = membership?.organization_id;
    if (!org_id) {
      return new Response(
        JSON.stringify({ error: "No organization found for user" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    const [servicesRes, partsRes] = await Promise.all([
      supabase
        .from("work_order_services")
        .select("*")
        .eq("work_order_id", work_order_id),
      supabase
        .from("work_order_parts")
        .select("*")
        .eq("work_order_id", work_order_id),
    ]);

    const services = servicesRes.data ?? [];
    const parts = partsRes.data ?? [];

    const { data: org } = await supabase
      .from("organizations")
      .select("name, address, phone, email")
      .eq("id", org_id)
      .single();

    const html = generateInvoiceHTML(wo, services, parts, org);

    return new Response(JSON.stringify({ html, work_order_id }), {
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

function generateInvoiceHTML(
  wo: Record<string, unknown>,
  services: Record<string, unknown>[],
  parts: Record<string, unknown>[],
  org: Record<string, unknown> | null,
): string {
  const servicesRows = services
    .map(
      (s) =>
        `<tr><td>${esc(s.service_name)}</td><td>${esc(s.quantity)}</td><td>${esc(s.unit_price)}</td><td>${esc(s.final_price)}</td></tr>`,
    )
    .join("\n");
  const partsRows = parts
    .map(
      (p) =>
        `<tr><td>${esc(p.part_name)}</td><td>${esc(p.quantity)}</td><td>${esc(p.unit_price)}</td><td>${esc(p.final_price)}</td></tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{font-family:sans-serif;margin:40px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style>
</head><body>
<h1>${esc(org?.name ?? "Invoice")}</h1>
<p>Work Order: ${esc(wo.id)}<br>Date: ${esc(wo.created_at)}<br>Status: ${esc(wo.status)}</p>
<h2>Services</h2>
<table><tr><th>Service</th><th>Qty</th><th>Price</th><th>Total</th></tr>${servicesRows}</table>
<h2>Parts</h2>
<table><tr><th>Part</th><th>Qty</th><th>Price</th><th>Total</th></tr>${partsRows}</table>
<h2>Total: ${esc(wo.total_amount)}</h2>
</body></html>`;
}
