import { NextResponse } from "next/server";
import { saveFacebookConnection } from "@/lib/facebookConnection";
import { consumePendingSelection } from "@/lib/facebookSelections";

function getAppBaseUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { selectionId?: string; pageId?: string }
    | null;

  if (!body?.selectionId || !body?.pageId) {
    return NextResponse.json(
      { error: "selectionId and pageId are required" },
      { status: 400 }
    );
  }

  const selectedPage = await consumePendingSelection(body.selectionId, body.pageId);
  if (!selectedPage) {
    return NextResponse.json(
      { error: "Selection expired or invalid page" },
      { status: 404 }
    );
  }

  await saveFacebookConnection({
    pageId: selectedPage.id,
    pageName: selectedPage.name,
    pageAccessToken: selectedPage.accessToken,
    connectedAt: new Date().toISOString(),
  });

  const redirectUrl = new URL("/", getAppBaseUrl());
  redirectUrl.searchParams.set("fb", "connected");
  redirectUrl.searchParams.set("message", `Connected ${selectedPage.name}`);

  return NextResponse.json({ success: true, redirectUrl: redirectUrl.toString() });
}
