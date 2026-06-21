const MAX_DIMENSION = 1024;
const QUALITY = 0.85;
const OUTPUT_FORMAT = "image/webp";

export async function compressImage(file: File): Promise<File> {
  // SVG files can't be rasterized — upload as-is
  if (file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(
    bitmap.width,
    bitmap.height,
    MAX_DIMENSION,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, OUTPUT_FORMAT, QUALITY),
  );
  if (!blob) return file;

  const ext = OUTPUT_FORMAT === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
  return new File([blob], name, { type: OUTPUT_FORMAT });
}

function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
