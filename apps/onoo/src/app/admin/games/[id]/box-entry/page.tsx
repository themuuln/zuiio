"use client";

import type { FormEvent } from "react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { FibaOfficialStats } from "@onoo/core";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BoxEntryPage() {
  const params = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FibaOfficialStats | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/admin/api/games/${params.id}/official-stats`,
        {
          method: "POST",
          body: new FormData(event.currentTarget),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        boxScore?: FibaOfficialStats;
      };

      if (!response.ok || !body.boxScore) {
        throw new Error(body.error ?? "Импорт хийж чадсангүй");
      }

      setResult(body.boxScore);
      toast.success("Албан ёсны статистикийг хяналтад илгээлээ");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Импорт хийж чадсангүй",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Албан ёсны статистик импортлох</h1>
        <p className="text-sm text-muted-foreground">
          FIBA-ийн “Official Statistics” PDF-г оруулж, тоглогчдын мөр болон
          эцсийн оноог автоматаар уншуулна.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PDF нотолгоо</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="official-stats-file">FIBA PDF</Label>
              <Input
                id="official-stats-file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                required
              />
              <p className="text-xs text-muted-foreground">
                Сонгогдсон PDF нь нотолгоо хэлбэрээр аюулгүй хадгалагдана.
              </p>
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                name="rightsConfirmed"
                type="checkbox"
                value="true"
                required
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                Энэхүү албан ёсны статистикийг ашиглах, хадгалах эрхтэйгээ
                баталгаажуулж байна.
              </span>
            </label>

            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-foreground">
              Импорт хийсний дараа статистик шууд нийтлэгдэхгүй. “Шалгах” табд
              PDF болон уншсан үр дүнг баталгаажуулсны дараа л тоглолтын албан
              ёсны бүртгэлд орно.
            </p>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Уншиж байна..." : "PDF уншиж, хяналтад илгээх"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Уншсан үр дүн</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold tabular-nums">
              {result.score.home} – {result.score.away}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.teams.map((team) => (
                <div key={team.code} className="rounded-md border p-3">
                  <p className="font-medium">
                    {team.name} ({team.code})
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {team.players.length} тоглогчийн мөр уншигдлаа
                  </p>
                </div>
              ))}
            </div>
            {result.warnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700 dark:text-amber-400">
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
