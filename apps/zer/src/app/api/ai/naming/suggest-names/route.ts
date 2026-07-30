import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { suggestStoreNames } from "@/lib/ai/business-naming";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const businessType = body.business_type?.toString() ?? "";
    const keywords: string[] = body.keywords ?? [];
    const count = body.count ? Number(body.count) : undefined;

    if (!businessType) {
      return NextResponse.json(
        { error: "Бизнесийн төрөл шаардлагатай." },
        { status: 400 },
      );
    }

    const result = await suggestStoreNames({
      businessType,
      keywords: Array.isArray(keywords) ? keywords.filter(Boolean) : undefined,
      count,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ names: result.names });
  } catch (err) {
    capture(err, { context: "api: ai/naming/suggest-names" });
    return NextResponse.json(
      { error: "Нэр санал болгоход алдаа гарлаа." },
      { status: 500 },
    );
  }
}
