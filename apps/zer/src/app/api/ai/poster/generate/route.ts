import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import {
  generatePosterCore,
  PLATFORM_SIZES,
  POSTER_STYLES,
} from "@/lib/ai/poster-core";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productName = body.product_name?.toString() ?? "";
    const productImageUrl = body.product_image_url?.toString() ?? "";
    const styleId = body.style_id?.toString() ?? "";
    const platform = body.platform?.toString() ?? "";
    const customPrompt = body.custom_prompt?.toString() ?? "";
    const promotionalText = body.promotional_text?.toString() ?? "";

    if (!productName || !productImageUrl || !styleId || !platform) {
      return NextResponse.json(
        { error: "Бүх шаардлагатай талбаруудыг бөглөнө үү." },
        { status: 400 },
      );
    }

    const validStyle = POSTER_STYLES.find((s) => s.id === styleId);
    if (!validStyle) {
      return NextResponse.json(
        { error: "Буруу загвар сонголт." },
        { status: 400 },
      );
    }

    if (!PLATFORM_SIZES[platform]) {
      return NextResponse.json(
        { error: "Буруу платформ сонголт." },
        { status: 400 },
      );
    }

    const result = await generatePosterCore({
      productName,
      productImageUrl,
      styleId,
      platform,
      customPrompt,
      promotionalText,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ poster_url: result.posterUrl });
  } catch (err) {
    capture(err, { context: "api: ai/poster/generate" });
    return NextResponse.json(
      { error: "Постер үүсгэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
