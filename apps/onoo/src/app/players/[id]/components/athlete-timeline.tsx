import { ScrollText } from "lucide-react";
import { getAthleteTimeline, getPlayerCanonicalIdentity } from "@/app/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AthleteTimelineProps {
  playerId: string;
  locale?: "mn" | "en";
}

export async function AthleteTimeline({
  playerId,
  locale = "mn",
}: AthleteTimelineProps) {
  const canonicalIdentityId = await getPlayerCanonicalIdentity(playerId);
  if (!canonicalIdentityId) return null;

  const events = await getAthleteTimeline(canonicalIdentityId, 15);
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="size-4" />
          {locale === "en" ? "Athlete Timeline" : "Үйл ажиллагааны хронологи"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div
            className="absolute left-3 top-2 bottom-2 w-px bg-border"
            aria-hidden="true"
          />

          {events.map((event, i) => (
            <div
              key={`${event.event_type}-${event.event_id}`}
              className="relative flex gap-4"
            >
              {/* Event dot */}
              <div
                className={`relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  event.event_type === "game"
                    ? "border-emerald-500 bg-emerald-500/20"
                    : "border-amber-500 bg-amber-500/20"
                }`}
                aria-hidden="true"
              >
                <div
                  className={`size-2 rounded-full ${
                    event.event_type === "game"
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
              </div>

              {/* Event content */}
              <div className="min-w-0 flex-1 space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {event.event_type === "game"
                      ? locale === "en"
                        ? "Game"
                        : "Тоглолт"
                      : locale === "en"
                        ? "Enrollment"
                        : "Бүртгэл"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.event_date).toLocaleDateString(
                      locale === "mn" ? "mn-MN" : "en-US",
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </span>
                </div>

                {event.event_type === "game" && (
                  <>
                    <p className="text-sm font-medium">
                      {event.opponent_name} — {event.home_score ?? "?"}:
                      {event.away_score ?? "?"}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {event.pts != null && <span>PTS: {event.pts}</span>}
                      {event.assists != null && (
                        <span>AST: {event.assists}</span>
                      )}
                      {event.total_rebounds != null && (
                        <span>REB: {event.total_rebounds}</span>
                      )}
                    </div>
                  </>
                )}

                {event.event_type === "enrollment" && (
                  <p className="text-sm">
                    <span className="font-medium">{event.program_name}</span>
                    {event.event_label && (
                      <span className="text-xs text-muted-foreground ml-1">
                        — {event.event_label}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
