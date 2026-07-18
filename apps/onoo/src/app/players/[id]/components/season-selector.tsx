"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Competition {
  competition_id: string;
  competition_name: string;
  season_name: string;
  league_name: string;
}

interface SeasonSelectorProps {
  competitions: Competition[];
  currentCompetitionId: string | null;
  className?: string;
}

const CAREER_VALUE = "__career__";

export function SeasonSelector({
  competitions,
  currentCompetitionId,
  className,
}: SeasonSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === CAREER_VALUE) {
      params.set("season", "career");
    } else {
      params.set("season", value);
    }
    router.push(`?${params.toString()}`);
  }

  const currentValue = currentCompetitionId ?? CAREER_VALUE;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          "w-full border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground sm:w-72",
          className,
        )}
        aria-label={
          "\u0423\u043B\u0438\u0440\u0430\u043B \u0441\u043E\u043D\u0433\u043E\u0445"
        }
      >
        <SelectValue
          placeholder={
            "\u0423\u043B\u0438\u0440\u0430\u043B \u0441\u043E\u043D\u0433\u043E\u0445"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={CAREER_VALUE}>
          {"\u041A\u0430\u0440\u044C\u0435\u0440"}
        </SelectItem>
        {competitions.map((c) => (
          <SelectItem key={c.competition_id} value={c.competition_id}>
            {c.season_name} \u2014 {c.competition_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
