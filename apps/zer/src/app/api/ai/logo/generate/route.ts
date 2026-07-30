import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { generateLogo } from "@/lib/ai/logo-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const businessName = body.business_name?.toString() ?? "";
    const industry = body.industry?.toString() ?? "";
    const style = body.style?.toString() ?? "";

    if (!businessName) {
      return NextResponse.json(
        { error: "Бизнесийн нэр шаардлагатай." },
        { status: 400 },
      );
    }

    const validStyles = ["minimal", "modern", "classic", "playful"];
    const resolvedStyle =
      style && validStyles.includes(style)
        ? (style as "minimal" | "modern" | "classic" | "playful")
        : undefined;

    const result = await generateLogo({
      businessName,
      industry: industry || undefined,
      style: resolvedStyle,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ image_url: result.imageUrl });
  } catch (err) {
    capture(err, { context: "api: ai/logo/generate" });
    return NextResponse.json(
      { error: "Лого үүсгэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
