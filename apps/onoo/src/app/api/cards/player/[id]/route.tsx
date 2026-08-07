import { ImageResponse } from "next/og";
import { getPlayerById } from "@/app/lib/data";
import { loadFont } from "../../_load-font";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await getPlayerById(id);
  if (!data?.player) {
    return new Response("Player not found", { status: 404 });
  }

  const p = data.player;
  const name = p.canonical_name;
  const team = p.team_name;
  const ppg = p.points_per_game ?? 0;
  const rpg = (p.oreb_per_game ?? 0) + (p.dreb_per_game ?? 0);
  const apg = p.ast_per_game ?? 0;
  const spg = p.stl_per_game ?? 0;
  const bpg = p.blk_per_game ?? 0;
  const fgp =
    p.fgm_per_game != null && p.fga_per_game != null && p.fga_per_game > 0
      ? (p.fgm_per_game / p.fga_per_game) * 100
      : null;

  const stats = [
    { label: "PTS", value: ppg.toFixed(1) },
    { label: "REB", value: rpg.toFixed(1) },
    { label: "AST", value: apg.toFixed(1) },
    { label: "STL", value: spg.toFixed(1) },
    { label: "BLK", value: bpg.toFixed(1) },
    ...(fgp != null ? [{ label: "FG%", value: `${fgp.toFixed(1)}%` }] : []),
  ];

  const [oswaldSemiBold, oswaldBold, interRegular] = await Promise.all([
    loadFont("Oswald", 600),
    loadFont("Oswald", 800),
    loadFont("Inter", 400),
  ]);

  const fonts = [
    ...(oswaldSemiBold
      ? [
          {
            name: "Oswald",
            data: oswaldSemiBold,
            weight: 600 as const,
            style: "normal" as const,
          },
        ]
      : []),
    ...(oswaldBold
      ? [
          {
            name: "Oswald",
            data: oswaldBold,
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
        position: "relative",
        fontFamily: '"Oswald", sans-serif',
      }}
    >
      {/* Team color accent stripe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 10,
          background: "#f97316",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginLeft: 56,
          flex: 1,
          padding: "40px 48px 40px 0",
        }}
      >
        {/* Player name */}
        <div
          style={{
            fontSize: 52,
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
              fontSize: 22,
              color: "#a1a1aa",
              marginTop: 8,
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {`${team} · ${p.season_name ?? ""}`}
          </div>
        )}

        {/* Stats grid */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
            flexWrap: "wrap",
          }}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: "16px 24px",
                minWidth: 80,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#f97316",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: '"Oswald", sans-serif',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#71717a",
                  marginTop: 6,
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Branding — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 40,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Onoo logo"
        >
          <circle cx="16" cy="16" r="14" stroke="white" strokeWidth="2" />
          <circle cx="16" cy="16" r="5" fill="white" />
        </svg>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          Оноо
        </span>
      </div>
    </div>,
    {
      width: 800,
      height: 400,
      fonts,
    },
  );
}
