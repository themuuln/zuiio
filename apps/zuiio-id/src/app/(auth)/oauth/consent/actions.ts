"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface ConsentParams {
  client_id?: string;
  redirect_uri?: string;
  state?: string;
  scope?: string;
  response_type?: string;
}

interface OAuthClientInfo {
  id: string;
  name: string;
  logo: string | null;
  redirect_uris: string[];
}

/**
 * Fetch OAuth client information from Supabase.
 */
export async function getClientInfo(clientId: string): Promise<OAuthClientInfo | null> {
  const admin = await createAdminClient();

  // Supabase stores OAuth apps in the auth schema
  const { data, error } = await admin
    .schema("auth")
    .from("oauth_apps")
    .select("id, name, logo, redirect_uris")
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    logo: data.logo,
    redirect_uris: data.redirect_uris,
  };
}

/**
 * Approve the OAuth authorization request.
 * Calls Supabase's approve endpoint to generate an authorization code.
 */
export async function approveConsent(params: ConsentParams) {
  const { client_id, redirect_uri, state, scope, response_type } = params;

  if (!client_id || !redirect_uri) {
    return { error: "Missing required parameters" };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // User not logged in — redirect to login with return URL
    const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    loginUrl.searchParams.set("return_to", `/oauth/consent?${new URLSearchParams(params as Record<string, string>).toString()}`);
    redirect(loginUrl.toString());
  }

  // Call the Supabase OAuth approve endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: "Server configuration error" };
  }

  const approveResponse = await fetch(`${supabaseUrl}/auth/v1/oauth/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey,
    },
    body: JSON.stringify({
      client_id,
      redirect_uri,
      state,
      scope: scope || "openid email profile",
      response_type: response_type || "code",
      user_id: session.user.id,
    }),
  });

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
 * Redirects back to the client with an access_denied error.
 */
export async function denyConsent(params: ConsentParams) {
  const { redirect_uri, state } = params;

  if (!redirect_uri) {
    redirect("/");
  }

  const url = new URL(redirect_uri!);
  url.searchParams.set("error", "access_denied");
  url.searchParams.set("error_description", "The user denied the request");
  if (state) {
    url.searchParams.set("state", state);
  }

  redirect(url.toString());
}
