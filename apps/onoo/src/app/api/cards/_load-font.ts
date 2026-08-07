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
            "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        },
      },
    ).then((r) => r.text());

    const match = css.match(
      /url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/,
    );
    if (!match?.[1]) return null;
    return fetch(match[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}
