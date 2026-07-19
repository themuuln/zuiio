import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Load env
const envPath = resolve(import.meta.dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const MAX_DIMENSION = 800;
const QUALITY = 80;

// Extract the first product image from HTML content
function extractImages(html: string): string[] {
  const patterns = [
    // Generic product images from img tags
    /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi,
    // Open Graph / meta images
    /<meta[^>]+property=["']og:image["'][^>]+content=["'](https?:\/\/[^"']+)["']/gi,
    /<meta[^>]+content=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["'][^>]+property=["']og:image["']/gi,
  ];

  const urls: string[] = [];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1];
      // Skip tiny icons, logos, tracking pixels
      if (
        url.includes("logo") ||
        url.includes("icon") ||
        url.includes("favicon") ||
        url.includes("tracking") ||
        url.includes("pixel") ||
        url.includes("facebook") ||
        url.includes("google") ||
        url.includes("analytics") ||
        url.includes("1x1") ||
        url.includes("badge") ||
        url.includes("flag")
      )
        continue;
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

// Download an image with browser-like headers
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${new URL(url).origin}/`,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    return null;
  }
}

// Compress and convert to webp using sharp
async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toBuffer();
}

// Upload to Supabase Storage and return public URL
async function uploadToStorage(
  productId: string,
  buffer: Buffer,
): Promise<string | null> {
  const filePath = `products/${productId}.webp`;

  const { error } = await supabase.storage
    .from("brand_assets")
    .upload(filePath, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    console.error(`  Upload error: ${error.message}`);
    return null;
  }

  const { data } = supabase.storage.from("brand_assets").getPublicUrl(filePath);
  return data.publicUrl;
}

// Search for product images using multiple sources
async function searchForImage(productName: string): Promise<string | null> {
  // Try searching on sites known to carry Real Pharm products
  const strippedName = productName
    .replace(/ProActive |Real Pharm /gi, "")
    .trim();
  const searchSites = [
    {
      name: "fithealthy",
      search: `https://www.fithealthy.eu/en/search?query=${encodeURIComponent(productName)}`,
    },
    {
      name: "realpharmsupplements",
      search: `https://realpharmsupplements.com/search?q=${encodeURIComponent(strippedName)}`,
    },
    {
      name: "maltasupplementbase",
      search: `https://www.maltasupplementbase.com/?s=${encodeURIComponent(strippedName)}`,
    },
    {
      name: "bodyshock",
      search: `https://bodyshock.pro/en/search?query=${encodeURIComponent(strippedName)}`,
    },
    {
      name: "supplementhouse",
      search: `https://supplementhouse.cy/?s=${encodeURIComponent(productName)}&post_type=product`,
    },
  ];

  for (const site of searchSites) {
    try {
      const res = await fetch(site.search, {
        headers: { "User-Agent": UA },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const images = extractImages(html);

      // Find a good product image (prefer larger images, skip small ones)
      for (const imgUrl of images) {
        // Skip obviously non-product images
        if (imgUrl.includes("400x400")) continue;

        // Try downloading to verify it works
        const buf = await downloadImage(imgUrl);
        if (buf && buf.length > 5000) {
          // At least 5KB = likely a real product image
          return imgUrl;
        }
      }
    } catch {}
  }

  return null;
}

async function main() {
  // Get all Real Pharm products without images
  const { data: brands } = await supabase
    .from("brands")
    .select("id")
    .ilike("name", "%real pharm%");

  const brandIds = (brands || []).map((b) => b.id);

  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("brand_id", brandIds)
    .is("deleted_at", null)
    .is("image_url", null)
    .order("name");

  if (!products || products.length === 0) {
    return;
  }

  let _successCount = 0;
  let _failCount = 0;

  for (const product of products) {
    process.stdout.write(`${product.name} ... `);

    const imgUrl = await searchForImage(product.name);
    if (!imgUrl) {
      _failCount++;
      continue;
    }

    const downloaded = await downloadImage(imgUrl);
    if (!downloaded) {
      _failCount++;
      continue;
    }

    const compressed = await compressImage(downloaded);
    const publicUrl = await uploadToStorage(product.id, compressed);
    if (!publicUrl) {
      _failCount++;
      continue;
    }

    // Update the product in the database
    const { error } = await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", product.id);

    if (error) {
      _failCount++;
    } else {
      _successCount++;
    }
  }
}

main().catch(console.error);
