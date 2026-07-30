import { capture } from "@zuiio/capture";
import { type NextRequest, NextResponse } from "next/server";
import { generateProductDescription } from "@/lib/ai/product-description";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productName = body.product_name?.toString() ?? "";
    const category = body.category?.toString() ?? "";
    const price = body.price ? Number(body.price) : undefined;
    const sku = body.sku?.toString() ?? "";
    const existingDescription = body.existing_description?.toString() ?? "";

    if (!productName) {
      return NextResponse.json(
        { error: "Бүтээгдэхүүний нэр шаардлагатай." },
        { status: 400 },
      );
    }

    const result = await generateProductDescription({
      productName,
      category: category || undefined,
      price,
      sku: sku || undefined,
      existingDescription: existingDescription || undefined,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ description: result.description });
  } catch (err) {
    capture(err, { context: "api: ai/product-description" });
    return NextResponse.json(
      { error: "Тайлбар үүсгэхэд алдаа гарлаа." },
      { status: 500 },
    );
  }
}
