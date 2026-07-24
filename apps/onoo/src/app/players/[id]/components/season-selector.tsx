"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Competition {
  competition_id: string;
  competition_name: string;
  season_name: string;
  league_name: string;
}

interface SeasonSelectorProps {
  competitions: Competition[];
  currentCompetitionId: string | null;
}

const CAREER_VALUE = "__career__";

export function SeasonSelector({
  competitions,
  currentCompetitionId,
}: SeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === CAREER_VALUE) {
      params.delete("season");
    } else {
      params.set("season", value);
    }
    router.push(`?${params.toString()}`);
  }

  const currentValue = currentCompetitionId ?? CAREER_VALUE;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[280px]" aria-label="Улирал сонгох">
        <SelectValue placeholder="Улирал сонгох" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CAREER_VALUE}>Карьер</SelectItem>
        {competitions.map((c) => (
          <SelectItem key={c.competition_id} value={c.competition_id}>
            {c.season_name} — {c.competition_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
