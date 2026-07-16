"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ConsentParams {
  authorization_id?: string;
}

/**
 * Approve the OAuth authorization request.
 * Calls Supabase's approve endpoint to generate an authorization code.
 */
export async function approveConsent(params: ConsentParams) {
  const { authorization_id } = params;

  if (!authorization_id) {
    return { error: "Missing required parameters" };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // User not logged in — redirect to login with return URL
    const loginUrl = new URL(
      "/login",
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    );
    loginUrl.searchParams.set(
      "return_to",
      `/oauth/consent?authorization_id=${authorization_id}`,
    );
    redirect(loginUrl.toString());
  }

  // Call the Supabase OAuth approve endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server configuration error" };
  }

  const approveResponse = await fetch(
    `${supabaseUrl}/auth/v1/oauth/approve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        authorization_id,
        user_id: session.user.id,
      }),
    },
  );

  if (!approveResponse.ok) {
    const errorData = await approveResponse.text();
    console.error("OAuth approve failed:", errorData);
    return { error: "Failed to approve consent" };
  }

  const { redirect_to } = await approveResponse.json();

  if (!redirect_to) {
    return { error: "No redirect URL returned" };
  }

  redirect(redirect_to);
}

/**
 * Deny the OAuth authorization request.
 * Calls Supabase's deny endpoint to reject the authorization.
 */
export async function denyConsent(params: ConsentParams) {
  const { authorization_id } = params;

  if (!authorization_id) {
    redirect("/");
  }

  // Call the Supabase OAuth deny endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    redirect("/");
  }

  const denyResponse = await fetch(`${supabaseUrl}/auth/v1/oauth/deny`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
    body: JSON.stringify({
      authorization_id,
    }),
  });

  if (!denyResponse.ok) {
    const errorData = await denyResponse.text();
    console.error("OAuth deny failed:", errorData);
    redirect("/");
  }

  const { redirect_to } = await denyResponse.json();

  if (redirect_to) {
    redirect(redirect_to);
  }

  redirect("/");
}
