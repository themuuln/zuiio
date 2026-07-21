import { Scoreboard } from "@/components/games/uno/scoreboard";

interface ScoresPageProps {
  params: Promise<{ code: string }>;
}

export default async function ScoresPage({ params }: ScoresPageProps) {
  const { code } = await params;

  return (
    <div className="mx-auto max-w-lg">
      <Scoreboard roomCode={code.toUpperCase()} />
    </div>
  );
}
