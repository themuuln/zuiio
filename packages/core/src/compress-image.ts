const MAX_DIMENSION = 1024;
const QUALITY = 0.85;
const OUTPUT_FORMAT = "image/webp";

/**
 * Client-side image compressor for uploads.
 *
 * - Applies EXIF orientation (`imageOrientation: "from-image"`) so portrait
 *   camera photos keep their real aspect ratio. Browsers before Chrome 112 /
 *   Firefox 111 / Safari 16 ignored EXIF and produced sideways bitmaps, which
 *   flipped the effective aspect ratio of every phone photo.
 * - Returns the ORIGINAL file untouched when it already fits MAX_DIMENSION,
 *   so size, format, and metadata are preserved instead of being re-encoded.
 * - Falls back to the original file when the source cannot be decoded, so
 *   uploads never fail on unsupported types.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
  } catch {
    return file;
  }

  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_DIMENSION,
    );

    // Already fits the target size — keep the original file as-is.
    if (width === bitmap.width && height === bitmap.height) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    // biome-ignore lint/style/noNonNullAssertion: 2d context is always available
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, OUTPUT_FORMAT, QUALITY),
    );
    if (!blob) return file;

    const ext = OUTPUT_FORMAT === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
    return new File([blob], name, { type: OUTPUT_FORMAT });
  } finally {
    bitmap.close();
  }
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
