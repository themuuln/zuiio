// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve({ timeout: 300000 }, async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find all subscriptions that are past expiry
  const { data: expired, error: fetchError } = await supabase
    .from("subscription_plans")
    .select("id, organization_id, status")
    .in("status", ["trial", "active"])
    .lt("expires_at", new Date().toISOString())
    .is("deleted_at", null)
    .limit(1000);

  if (fetchError) {
    console.error("Failed to fetch expired subscriptions:", fetchError);
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!expired || expired.length === 0) {
    console.log("No expired subscriptions found");
    return new Response(
      JSON.stringify({ expired: 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const ids = expired.map((s) => s.id);

  const { error: updateError } = await supabase
    .from("subscription_plans")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) {
    console.error("Failed to update expired subscriptions:", updateError);
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`Expired ${ids.length} subscriptions`);
  return new Response(
    JSON.stringify({ expired: ids.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});
