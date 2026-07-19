import { ImageResponse } from "next/og";
import { getTeamBySlug } from "../../lib/data";

export const runtime = "edge";
export const alt = "Оноо — Багийн мэдээлэл";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(
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

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getTeamBySlug(slug);

  const teamName = data?.team?.name ?? "Баг";
  const wins = data?.standings?.wins ?? 0;
  const losses = data?.standings?.losses ?? 0;
  const winPct =
    wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0.0";
  const teamColor = data?.team?.primary_color ?? "#3b82f6";

  const [barlowRegular, barlowBold, interRegular] = await Promise.all([
    loadFont("Oswald", 600),
    loadFont("Oswald", 800),
    loadFont("Inter", 400),
  ]);

  const fonts = [
    ...(barlowRegular
      ? [
          {
            name: "Oswald",
            data: barlowRegular,
            weight: 600 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(barlowBold
      ? [
          {
            name: "Oswald",
            data: barlowBold,
            weight: 800 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(interRegular
      ? [
          {
            name: "Inter",
            data: interRegular,
            weight: 400 as const,
            style: "normal" as const,
          },
        ]
      : []),
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: '"Oswald", sans-serif',
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `linear-gradient(90deg, ${teamColor}, ${teamColor}66)`,
        }}
      />

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 64,
          paddingRight: 64,
          flex: 1,
        }}
      >
        {/* Team name */}
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          {teamName}
        </div>

        {/* Record row */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 32,
            marginTop: 32,
          }}
        >
          {/* W-L */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: teamColor,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {wins}
            </span>
            <span
              style={{
                fontSize: 36,
                color: "#52525b",
              }}
            >
              —
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#a1a1aa",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {losses}
            </span>
          </div>

          {/* Win % */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: 24,
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: "#71717a",
              }}
            >
              Ялалтын хувь
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#ffffff",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {winPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Branding — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Оноо logo"
        >
          <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="white" />
        </svg>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Оноо
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts,
    },
  );
}
