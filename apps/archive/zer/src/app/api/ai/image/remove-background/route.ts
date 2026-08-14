import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@/lib/ai/image-enhancer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const imageUrl = body.image_url?.toString() ?? "";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Зургийн URL шаардлагатай." },
        { status: 400 },
      );
    }

    const result = await removeBackground(imageUrl);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ image_url: result.imageUrl });
  } catch (err) {
    capture(err, { context: "api: ai/image/remove-background" });
    return NextResponse.json(
      { error: "Зургийн дэвсгэр арилгахад алдаа гарлаа." },
      { status: 500 },
    );
  }
}
