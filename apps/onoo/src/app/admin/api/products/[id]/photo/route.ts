import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "product-images";
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Файл оруулна уу" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Зөвхөн JPEG, PNG, Webp файл хүлээн авна" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Файлын хэмжээ 2MB-аас хэтрэх ёсгүй" },
      { status: 400 },
    );
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${id}/${timestamp}.${ext}`;

  // Upload (upsert to support re-upload)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    Sentry.captureException(uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Prepend the new image URL to the product's images array
  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .single();

  const existingImages = (product?.images as string[]) ?? [];
  const updatedImages = [
    publicUrl,
    ...existingImages.filter((u) => u !== publicUrl),
  ];

  const { error: updateError } = await supabase
    .from("products")
    .update({ images: updatedImages })
    .eq("id", id);

  if (updateError) {
    Sentry.captureException(updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ images: updatedImages });
}
