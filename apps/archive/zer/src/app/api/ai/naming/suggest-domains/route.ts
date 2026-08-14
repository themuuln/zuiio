import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { suggestDomainNames } from "@/lib/ai/business-naming";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const storeName = body.store_name?.toString() ?? "";

    if (!storeName) {
      return NextResponse.json(
        { error: "Дэлгүүрийн нэр шаардлагатай." },
        { status: 400 },
      );
    }

    const result = await suggestDomainNames({ storeName });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ domains: result.domains });
  } catch (err) {
    capture(err, { context: "api: ai/naming/suggest-domains" });
    return NextResponse.json(
      { error: "Домэйн нэр санал болгоход алдаа гарлаа." },
      { status: 500 },
    );
  }
}
