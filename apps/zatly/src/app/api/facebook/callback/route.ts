import { NextRequest, NextResponse } from "next/server";
import { createPendingSelection } from "@/lib/facebookSelections";

const FB_APP_ID = process.env.FB_APP_ID || process.env.NEXT_PUBLIC_FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const FB_OAUTH_REDIRECT_URI = process.env.FB_OAUTH_REDIRECT_URI;

type FacebookPage = {
  id: string;
  name: string;
  access_token: string;
};

function getAppBaseUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

function redirectWithStatus(status: "connected" | "error", message?: string) {
  const url = new URL("/", getAppBaseUrl());
  url.searchParams.set("fb", status);
  if (message) {
    url.searchParams.set("message", message);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const stateCookie = request.cookies.get("fb_oauth_state")?.value;

  if (!state || !stateCookie || state !== stateCookie) {
    return redirectWithStatus("error", "Invalid OAuth state");
  }

  if (!code) {
    return redirectWithStatus("error", "Missing authorization code");
  }

  if (!FB_APP_ID || !FB_APP_SECRET || !FB_OAUTH_REDIRECT_URI) {
    return redirectWithStatus("error", "Facebook app env is not configured");
  }

  try {
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", FB_APP_ID);
    tokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", FB_OAUTH_REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: { message?: string } };

    if (!tokenResponse.ok || !tokenData.access_token) {
      return redirectWithStatus(
        "error",
        tokenData.error?.message || "Failed to exchange access token"
      );
    }

    const pagesUrl = new URL("https://graph.facebook.com/v21.0/me/accounts");
    pagesUrl.searchParams.set("access_token", tokenData.access_token);
    pagesUrl.searchParams.set("fields", "id,name,access_token");

    const pagesResponse = await fetch(pagesUrl);
    const pagesData = (await pagesResponse.json()) as {
      data?: FacebookPage[];
      error?: { message?: string };
    };

    if (!pagesResponse.ok || !pagesData.data?.length) {
      return redirectWithStatus(
        "error",
        pagesData.error?.message || "No Facebook pages found for this account"
      );
    }

    const selectionId = await createPendingSelection(pagesData.data);
    const selectPageUrl = new URL("/facebook/select", getAppBaseUrl());
    selectPageUrl.searchParams.set("selection", selectionId);
    const response = NextResponse.redirect(selectPageUrl);
    response.cookies.set("fb_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch {
    return redirectWithStatus("error", "Unexpected error while connecting page");
  }
}
