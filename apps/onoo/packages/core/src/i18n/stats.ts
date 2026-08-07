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
    reb: "Буулт",
    dreb: "Давсан (хамааралтай)",
    ast: "Олгосон",
    stl: "Булаасан",
    blk: "Блок",
    tov: "Алдаа",
    pf: "Зөрчил",
    gp: "Тоглолт",
    mpg: "Дундаж (мин)",
    game_score: "Тоглолтын үнэлгээ",
    per: "PER",
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
    reb: "REB",
    dreb: "DREB",
    ast: "AST",
    stl: "STL",
    blk: "BLK",
    tov: "TOV",
    pf: "PF",
    gp: "GP",
    mpg: "MPG",
    team_reb: "TEAM REB",
    game_score: "Game Score",
    per: "PER",
  },
} as const;

export type Locale = keyof typeof STAT_LABELS;
export type StatKey = keyof (typeof STAT_LABELS)["en"];

export function getStatLabel(stat: StatKey, locale: Locale = "mn"): string {
  return STAT_LABELS[locale][stat] ?? stat;
}

export const MILESTONE_LABELS: Record<string, { mn: string; en: string }> = {
  career_high_pts: { mn: "Онооны карьерийн дээд", en: "Career High PTS" },
  career_high_reb: { mn: "Самбарын карьерийн дээд", en: "Career High REB" },
  career_high_ast: { mn: "Дамжуулалтын карьерийн дээд", en: "Career High AST" },
  career_high_stl: { mn: "Булааны карьерийн дээд", en: "Career High STL" },
  career_high_blk: { mn: "Блокын карьерийн дээд", en: "Career High BLK" },
  double_double: { mn: "Давхар-X", en: "Double-Double" },
  triple_double: { mn: "Гурван-X", en: "Triple-Double" },
  twenty_plus: { mn: "20+ оноо", en: "20+ Points" },
  double_digit_streak: {
    mn: "Хоёр орон тооны цуврал",
    en: "Double-Digit Streak",
  },
};
