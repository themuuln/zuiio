// Stat labels dictionary (mn + en)
export const STAT_LABELS = {
  mn: {
    pts: "Оноо",
    fgm: "Оролт",
    fga: "Оролт (нийт)",
    tpm: "Гурвалжин",
    tpa: "Гурвалжин (нийт)",
    ftm: "Ширэнгийн",
    fta: "Ширэнгийн (нийт)",
    oreb: "Давсан (хамааралгүй)",
    dreb: "Давсан (хамааралтай)",
    ast: "Олгосон",
    stl: "Булаасан",
    blk: " хаасан",
    tov: "Алдаа",
    pf: "Зөрчил",
    gp: "Тоглолт",
    mpg: "Дундаж (мин)",
    team_reb: "Багийн давсан",
  },
  en: {
    pts: "PTS",
    fgm: "FGM",
    fga: "FGA",
    tpm: "3PM",
    tpa: "3PA",
    ftm: "FTM",
    fta: "FTA",
    oreb: "OREB",
    dreb: "DREB",
    ast: "AST",
    stl: "STL",
    blk: "BLK",
    tov: "TOV",
    pf: "PF",
    gp: "GP",
    mpg: "MPG",
    team_reb: "TEAM REB",
  },
} as const;

export type Locale = keyof typeof STAT_LABELS;
export type StatKey = keyof typeof STAT_LABELS["en"];

export function getStatLabel(stat: StatKey, locale: Locale = "mn"): string {
  return STAT_LABELS[locale][stat] ?? stat;
}
