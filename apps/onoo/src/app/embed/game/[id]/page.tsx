import { notFound } from "next/navigation";
import { GameCard } from "@/app/components/game-card";
import { getGameById } from "@/app/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GameEmbedPage({ params }: Props) {
  const { id } = await params;
  const game = await getGameById(id);

  if (!game) notFound();

  return (
    <div className="flex min-h-0 flex-col gap-3 p-4">
      <GameCard game={game} />
      <footer className="text-right text-xs text-muted-foreground">
        <a
          href="https://onoo.mn"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          onoo.mn &uarr;
        </a>
      </footer>
    </div>
  );
}
