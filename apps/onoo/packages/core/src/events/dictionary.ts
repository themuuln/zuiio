export const EVENT_TYPES = {
  shot_2pt_made: { category: 'shot', requiresPlayer: true },
  shot_2pt_missed: { category: 'shot', requiresPlayer: true },
  shot_3pt_made: { category: 'shot', requiresPlayer: true },
  shot_3pt_missed: { category: 'shot', requiresPlayer: true },
  ft_made: { category: 'shot', requiresPlayer: true },
  ft_missed: { category: 'shot', requiresPlayer: true },
  rebound_off: { category: 'rebound', requiresPlayer: true },
  rebound_def: { category: 'rebound', requiresPlayer: true },
  rebound_team: { category: 'rebound', requiresPlayer: false },
  steal: { category: 'defense', requiresPlayer: true },
  block: { category: 'defense', requiresPlayer: true },
  turnover: { category: 'offense', requiresPlayer: true },
  foul_personal: { category: 'foul', requiresPlayer: true },
  foul_technical: { category: 'foul', requiresPlayer: true },
  substitution: { category: 'admin', requiresPlayer: false },
  timeout: { category: 'admin', requiresPlayer: false },
  period_start: { category: 'admin', requiresPlayer: false },
  period_end: { category: 'admin', requiresPlayer: false },
  game_start: { category: 'admin', requiresPlayer: false },
  game_end: { category: 'admin', requiresPlayer: false },
} as const;

export type EventTypeKey = keyof typeof EVENT_TYPES;
