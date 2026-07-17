import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getPlayerById } from "../../lib/data";

export const runtime = "edge";
export const alt = "Оноо — Тоглогчийн статистик";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont(
  family: string,
  weight: 400 | 700,
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPlayerById(id);

  const name = data?.player?.canonical_name ?? "Тоглогч";
  const team = data?.player?.team_name ?? "";
  const ppg = data?.player?.points_per_game;
  const reb =
    (data?.player?.oreb_per_game ?? 0) + (data?.player?.dreb_per_game ?? 0);
  const ast = data?.player?.ast_per_game;
    try {
      const supabase = await createClient();
      const { data: standing } = await supabase
      );
      const supabase = await createServerClient();
      const { data: standing } = await supabase
        .from("v_public_standings")
        .select("team_primary_color")
        .eq("team_slug", data.player.team_slug)
        .limit(1)
        .single();
      if (standing?.team_primary_color) {
        teamColor = standing.team_primary_color;
      }
    } catch {
      // Use default color
    }
  }

  const statParts: string[] = [];
  if (ppg != null) statParts.push(`${ppg.toFixed(1)} НГ`);
  if (reb) statParts.push(`${reb.toFixed(1)} ОВР`);
  if (ast != null) statParts.push(`${ast.toFixed(1)} ПАС`);
  const statLine = statParts.join("   ");

  const [regular, bold] = await Promise.all([
    loadFont("Noto Sans", 400),
    loadFont("Noto Sans", 700),
  ]);

  const fonts: Array<{
    name: string;
    data: ArrayBuffer;
    weight: number;
    style: string;
  }> = [];
  if (regular)
    fonts.push({
      name: "Noto Sans",
      data: regular,
      weight: 400,
      style: "normal",
    });
  if (bold)
    fonts.push({
      name: "Noto Sans",
      data: bold,
      weight: 700,
      style: "normal",
    });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          position: "relative",
          fontFamily: '"Noto Sans", sans-serif',
        }}
      >
        {/* Team color accent stripe */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 12,
            background: `linear-gradient(180deg, ${teamColor}, ${teamColor}66)`,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginLeft: 64,
            flex: 1,
          }}
        >
          {/* Player name */}
          <div
            style={{
              fontSize: 62,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

          {/* Team name */}
          {team && (
            <div
              style={{
                fontSize: 28,
                color: "#a1a1aa",
                marginTop: 12,
              }}
            >
              {team}
            </div>
          )}

          {/* Stats line */}
          {statLine && (
            <div
              style={{
                display: "flex",
                gap: 40,
                marginTop: 40,
              }}
            >
              {statParts.map((part, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 44,
                      fontWeight: 700,
                      color: teamColor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {part.split(" ")[0]}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: "#71717a",
                      marginTop: 4,
                    }}
                  >
                    {part.split(" ").slice(1).join(" ")}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
