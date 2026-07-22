/**
 * Shared font loader for Next.js OG image generation.
 *
 * Fetches font files from Google Fonts CSS API, following the same pattern
 * used in the app's opengraph-image.tsx files.
 */

import { fonts } from "./theme";

/**
 * Fetch a single font from Google Fonts by family and weight.
 *
 * Returns an ArrayBuffer for use with `ImageResponse` `fonts` option,
 * or `null` if the font could not be loaded (network failure, missing
 * font, etc.).
 */
export async function loadFont(
  family: string,
  weight: 400 | 500 | 600 | 700 | 800,
): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    ).then((r) => r.text());

    const match = css.match(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/,
    );
    if (!match?.[1]) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export interface FontEntry {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800;
  style: "normal";
}

/**
 * Load the standard OG image fonts concurrently.
 *
 * Returns an array of `FontEntry` objects suitable for spreading into
 * the `fonts` option of `ImageResponse`. Failed font loads are
 * silently excluded.
 */
export async function loadFonts(): Promise<FontEntry[]> {
  const [regular, bold, inter] = await Promise.all([
    loadFont(fonts.display, 400),
    loadFont(fonts.display, 700),
    loadFont(fonts.body, 400),
  ]);

  const result: FontEntry[] = [];

  if (regular) {
    result.push({
      name: fonts.display,
      data: regular,
      weight: 400,
      style: "normal",
    });
  }

  if (bold) {
    result.push({
      name: fonts.display,
      data: bold,
      weight: 700,
      style: "normal",
    });
  }

  if (inter) {
    result.push({
      name: fonts.body,
      data: inter,
      weight: 400,
      style: "normal",
    });
  }

  return result;
}
