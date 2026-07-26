import { notFound } from "next/navigation";
import { getHeadToHead, getTeamBySlug } from "@/app/lib/data";
import { MatchupClient } from "./matchup-client";

interface Props {
  params: Promise<{ teamA: string; teamB: string }>;
}

export default async function HeadToHeadPage({ params }: Props) {
  const { teamA, teamB } = await params;
  const [teamAData, teamBData] = await Promise.all([
    getTeamBySlug(teamA),
    getTeamBySlug(teamB),
  ]);
  if (!teamAData || !teamBData) notFound();

  const h2h = await getHeadToHead(teamAData.team.id, teamBData.team.id);

  return (
    <MatchupClient
      teamA={{
        name: teamAData.team.name,
        id: teamAData.team.id,
        slug: teamAData.team.slug,
      }}
      teamB={{
        name: teamBData.team.name,
        id: teamBData.team.id,
        slug: teamBData.team.slug,
      }}
      headToHead={h2h}
    />
  );
}
