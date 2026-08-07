"use client";

import { CalendarDays } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { CompetitionRow } from "@/app/lib/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompetitionSelectorProps {
  competitions: CompetitionRow[];
  currentId?: string;
}

export function CompetitionSelector({
  competitions,
  currentId,
}: CompetitionSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleValueChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("competition", value);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (competitions.length <= 1) return null;

  const validId =
    currentId && competitions.some((c) => c.id === currentId)
      ? currentId
      : (competitions[0]?.id ?? "");

  const selectedCompetition = competitions.find((c) => c.id === validId);
  const displayValue = selectedCompetition
    ? selectedCompetition.season
      ? `${selectedCompetition.name} · ${selectedCompetition.season}`
      : selectedCompetition.name
    : validId;

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Улирал</span>
      <Select value={validId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[160px] sm:w-[200px]">
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {competitions.map((comp) => (
            <SelectItem key={comp.id} value={comp.id}>
              {comp.season ? `${comp.name} · ${comp.season}` : comp.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
