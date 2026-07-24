// subscription-check — Server-side subscription status verification.
// Called before premium feature access to verify subscription tier.
// Returns: { tier, isActive, expiresAt, isGracePeriod }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GRACE_PERIOD_DAYS = 7;

interface SubscriptionCheckResult {
  tier: string;
  isActive: boolean;
  expiresAt: string | null;
  isGracePeriod: boolean;
  daysRemaining: number;
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role for DB access (authenticated user verified via JWT)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT and get user ID
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch profile subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      // Default to free tier
      const result: SubscriptionCheckResult = {
        tier: "free",
        isActive: true,
        expiresAt: null,
        isGracePeriod: false,
        daysRemaining: -1,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = profile.subscription_tier as string;

    // Free tier is always active
    if (tier === "free") {
      const result: SubscriptionCheckResult = {
        tier: "free",
        isActive: true,
        expiresAt: null,
        isGracePeriod: false,
        daysRemaining: -1,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for active subscription in payment_requests (verified)
    const { data: activePayment } = await supabase
      .from("payment_requests")
      .select("expires_at, status")
      .eq("user_id", user.id)
      .eq("tier", tier)
      .eq("status", "verified")
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date();

    if (!activePayment) {
      // No verified payment found — treat as expired
      const result: SubscriptionCheckResult = {
        tier: "free",
        isActive: false,
        expiresAt: null,
        isGracePeriod: false,
        daysRemaining: 0,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(activePayment.expires_at);
    const isExpired = now > expiresAt;

    if (!isExpired) {
      // Still active
      const daysRemaining = Math.ceil(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const result: SubscriptionCheckResult = {
        tier,
        isActive: true,
        expiresAt: expiresAt.toISOString(),
        isGracePeriod: false,
        daysRemaining,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Expired — check grace period
    const graceEnd = new Date(
      expiresAt.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );
    const isGracePeriod = now < graceEnd;

    if (isGracePeriod) {
      const daysRemaining = Math.ceil(
        (graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const result: SubscriptionCheckResult = {
        tier,
        isActive: true, // still active during grace
        expiresAt: expiresAt.toISOString(),
        isGracePeriod: true,
        daysRemaining,
      };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Grace period also expired — downgrade to free
    const result: SubscriptionCheckResult = {
      tier: "free",
      isActive: false,
      expiresAt: expiresAt.toISOString(),
      isGracePeriod: false,
      daysRemaining: 0,
    };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("subscription-check error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
