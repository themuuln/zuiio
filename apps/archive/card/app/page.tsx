"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircleQuestion, Wine, Flame, Sparkles, ArrowRight } from "lucide-react";

const GAMES = [
  {
    icon: MessageCircleQuestion,
    name: "Truth or Dare",
    description: "Secrets revealed, dares accepted",
  },
  {
    icon: Wine,
    name: "Never Have I Ever",
    description: "Confessions you didn't expect",
  },
  {
    icon: Flame,
    name: "Hot Takes",
    description: "Opinions that split the room",
  },
];

function GameCard({
  icon: Icon,
  name,
  description,
  index,
}: {
  icon: typeof MessageCircleQuestion;
  name: string;
  description: string;
  index: number;
}) {
  return (
    <div
      className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-sm transition-all duration-300 hover:shadow-brand hover:-translate-y-0.5 animate-in"
      style={{
        animationDelay: `${400 + index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-violet/20 to-brand-teal/20 text-brand-teal transition-colors duration-300 group-hover:from-brand-violet/30 group-hover:to-brand-teal/30">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium leading-tight">{name}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to create room");
      }
      const data = await res.json();
      router.push(`/${data.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleJoinRoom = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = roomCode.trim().toUpperCase();

      if (!/^[A-Z]{4}$/.test(trimmed)) {
        setError("Room code must be exactly 4 letters");
        return;
      }

      router.push(`/${trimmed}`);
    },
    [roomCode, router]
  );

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden px-4 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.50_0.26_275/0.12),transparent)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,oklch(0.70_0.16_195/0.08),transparent)]" />

      <main className="relative z-10 flex w-full max-w-sm flex-1 flex-col gap-10">
        {/* Badge */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="animate-in gap-1.5 border-brand-teal/30 px-3 py-1 text-[11px] font-normal text-brand-teal"
            style={{ animationDelay: "50ms", animationFillMode: "both" }}
          >
            <Sparkles className="size-3" />
            Party Game Night
          </Badge>
        </div>

        {/* Hero */}
        <div className="space-y-3 text-center">
          <h1
            className="animate-in bg-gradient-to-r from-[oklch(0.65_0.22_275)] via-[oklch(0.82_0.12_195)] to-[oklch(0.70_0.16_195)] bg-clip-text font-display text-6xl leading-none tracking-tight text-transparent sm:text-7xl"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            Friday
          </h1>
          <p
            className="animate-in text-balance text-sm text-muted-foreground sm:text-base"
            style={{ animationDelay: "150ms", animationFillMode: "both" }}
          >
            Game night, zero friction
          </p>
        </div>

        {/* Room form */}
        <Card
          className="animate-in border-border/50 shadow-sm"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-base">Start or Join a Room</CardTitle>
            <CardDescription>
              Create a new room or enter a code to join
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCreateRoom}
              disabled={loading}
              size="lg"
              className="w-full gap-2 font-semibold"
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  Create Room
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">
                  or join one
                </span>
              </div>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-3">
              <label htmlFor="room-code" className="sr-only">
                Room code
              </label>
              <input
                id="room-code"
                type="text"
                placeholder="Enter code"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                maxLength={4}
                className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-center text-lg uppercase tracking-[0.3em] placeholder:text-muted-foreground/60 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="outline"
                size="lg"
                className="w-full"
              >
                Join Room
              </Button>
            </form>

            {error && (
              <p className="animate-in text-balance text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Game showcase */}
        <div className="space-y-4">
          <div
            className="animate-in text-center"
            style={{ animationDelay: "300ms", animationFillMode: "both" }}
          >
            <Badge
              variant="secondary"
              className="border-none px-3 py-1 text-[11px] font-normal"
            >
              Party Games
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {GAMES.map((game, i) => (
              <GameCard key={game.name} {...game} index={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
