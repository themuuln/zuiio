import { apiError, createRouteHandler, ok } from "@/lib/api-response";
import { verifyAndClaimClockToken } from "@/lib/services/qr-token-service";
export const POST = createRouteHandler(async ({ request, user, supabase }) => {
  const body = (await request.json()) as { rawToken: string };
  if (!body.rawToken) {
    return apiError("BAD_REQUEST", "rawToken is required", 400);
  }

  const verified = await verifyAndClaimClockToken(
    supabase,
    body.rawToken,
    user.id,
  );
  if (!verified.valid) {
    return apiError(
      "INVALID_TOKEN",
      verified.reason ?? "Token is invalid or expired",
      400,
    );
  }

  // Step 1: Verify only — return direction and mechanic name for phone confirmation
  // The actual clock-in/out happens in Step 2 when user taps Confirm on the phone
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return ok({
    direction: verified.actionType === "clock_in" ? "in" : "out",
    actionType: verified.actionType,
    mechanicName: profile?.full_name ?? null,
  });
});
